import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";

// GET available tables for a specific time slot
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    const durationParam = searchParams.get("duration") || "60"; // Default to 1 hour
    const partySizeParam = searchParams.get("partySize");
    
    if (!dateParam || !timeParam) {
      return NextResponse.json(
        { error: "Missing required parameters: date and time" },
        { status: 400 }
      );
    }
    
    // Parse date and time
    const [year, month, day] = dateParam.split("-").map(Number);
    const [hour, minute] = timeParam.split(":").map(Number);
    
    const bookingTime = new Date(year, month - 1, day, hour, minute);
    const duration = parseInt(durationParam);
    const bookingEndTime = addMinutes(bookingTime, duration);
    
    console.log("Checking availability for:", {
      bookingTime: bookingTime.toISOString(),
      bookingEndTime: bookingEndTime.toISOString(),
      duration,
      partySize: partySizeParam ? parseInt(partySizeParam) : undefined
    });
    
    // Get all tables
    const allTables = await prisma.table.findMany({
      orderBy: {
        tableId: "asc",
      },
    });
    
    // Get all bookings that overlap with the requested time slot
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["confirmed", "pending"] },
        AND: [
          {
            bookingTime: {
              lt: bookingEndTime,
            },
          },
          {
            endTime: {
              gt: bookingTime,
            },
          },
        ],
      },
    });
    
    console.log(`Found ${overlappingBookings.length} overlapping bookings`);
    
    // Get the table IDs that are booked during the requested time slot
    const bookedTableIds = overlappingBookings.map(booking => booking.tableId);
    
    // Filter out tables that are already booked
    let availableTables = allTables.filter(table => !bookedTableIds.includes(table.tableId));
    
    // If party size is specified, filter tables by capacity
    if (partySizeParam) {
      const partySize = parseInt(partySizeParam);
      availableTables = availableTables.filter(table => table.capacity >= partySize);
    }
    
    // Check if the requested time is within opening hours
    const dayOfWeek = bookingTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const openingHours = await prisma.openingHours.findUnique({
      where: {
        dayOfWeek: dayOfWeek,
      },
    });
    
    if (!openingHours || !openingHours.isOpen) {
      return NextResponse.json(
        { 
          error: "The restaurant is closed on the selected day",
          availableTables: [],
          isOpen: false
        }
      );
    }
    
    // Parse opening hours
    const [openHour, openMinute] = openingHours.openTime.split(':').map(Number);
    const openTimeInMinutes = openHour * 60 + openMinute;
    
    const [closeHour, closeMinute] = openingHours.closeTime.split(':').map(Number);
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    
    // Check if booking time is within opening hours
    const bookingTimeInMinutes = hour * 60 + minute;
    const isWithinOpeningHours = 
      bookingTimeInMinutes >= openTimeInMinutes && 
      bookingTimeInMinutes + duration <= closeTimeInMinutes;
    
    if (!isWithinOpeningHours) {
      return NextResponse.json(
        { 
          error: "Booking time is outside of opening hours",
          availableTables: [],
          isOpen: true,
          openingHours: {
            open: openingHours.openTime,
            close: openingHours.closeTime
          }
        }
      );
    }
    
    return NextResponse.json({
      availableTables,
      totalTables: allTables.length,
      bookedTables: allTables.length - availableTables.length,
      isOpen: true,
      openingHours: {
        open: openingHours.openTime,
        close: openingHours.closeTime
      }
    });
  } catch (error) {
    console.error("Error checking table availability:", error);
    return NextResponse.json(
      { error: "Failed to check table availability", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}