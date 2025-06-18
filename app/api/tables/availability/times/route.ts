import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";

// GET available time slots for a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const partySizeParam = searchParams.get("partySize") || "2";
    
    if (!dateParam) {
      return NextResponse.json(
        { error: "Missing required parameter: date" },
        { status: 400 }
      );
    }
    
    // Parse date
    const [year, month, day] = dateParam.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);
    
    // Check if the date is valid
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }
    
    // Check if the date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return NextResponse.json(
        { error: "Cannot book dates in the past" },
        { status: 400 }
      );
    }
    
    // Get opening hours for the selected day
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const openingHours = await prisma.openingHours.findUnique({
      where: {
        dayOfWeek: dayOfWeek,
      },
    });
    
    if (!openingHours) {
      return NextResponse.json(
        { error: "Opening hours not found for the selected day" },
        { status: 400 }
      );
    }
    
    if (!openingHours.isOpen) {
      return NextResponse.json(
        { error: "The restaurant is closed on the selected day" },
        { status: 400 }
      );
    }
    
    // Parse opening hours
    const [openHour, openMinute] = openingHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = openingHours.closeTime.split(':').map(Number);
    
    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    
    // Generate time slots in 30-minute intervals
    const timeSlots = [];
    const duration = 120; // Default booking duration (2 hours)
    
    for (let minutes = openTimeInMinutes; minutes <= closeTimeInMinutes - duration; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
    
    // Get all tables that can accommodate the party size
    const tables = await prisma.table.findMany({
      where: {
        capacity: {
          gte: parseInt(partySizeParam),
        },
      },
    });
    
    if (tables.length === 0) {
      return NextResponse.json(
        { error: "No tables available for this party size" },
        { status: 400 }
      );
    }
    
    // Get all bookings for the selected date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookings = await prisma.booking.findMany({
      where: {
        bookingTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["confirmed", "pending"] },
      },
    });
    
    // Filter out time slots that don't have any available tables
    const availableTimes = timeSlots.filter(timeSlot => {
      const [hour, minute] = timeSlot.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      const slotEndTime = addMinutes(slotTime, duration);
      
      // Check if any table is available for this time slot
      return tables.some(table => {
        // Check if this table has any conflicting bookings
        const hasConflict = bookings.some(booking => {
          if (booking.tableId !== table.tableId) return false;
          
          const bookingTime = new Date(booking.bookingTime);
          const bookingEndTime = new Date(booking.endTime);
          
          // Check if the booking overlaps with the time slot
          return (
            (bookingTime < slotEndTime && bookingEndTime > slotTime)
          );
        });
        
        return !hasConflict;
      });
    });
    
    return NextResponse.json({
      availableTimes,
      openingHours: {
        open: openingHours.openTime,
        close: openingHours.closeTime
      }
    });
  } catch (error) {
    console.error("Error fetching available times:", error);
    return NextResponse.json(
      { error: "Failed to fetch available times", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}