import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";

// Create a booking from an external source (embedded form)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log("Creating external booking with data:", JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.customerName || !data.partySize || !data.bookingTime) {
      return NextResponse.json(
        { error: "Missing required fields", details: { data } },
        { status: 400 }
      );
    }
    
    // Parse booking time
    let bookingTime: Date;
    try {
      bookingTime = new Date(data.bookingTime);
      
      // Validate that the date is valid
      if (isNaN(bookingTime.getTime())) {
        throw new Error("Invalid date format");
      }
      
      console.log("Parsed booking time:", bookingTime.toISOString());
    } catch (error) {
      console.error("Error parsing booking time:", error);
      return NextResponse.json(
        { 
          error: "Invalid booking time format", 
          details: { 
            providedTime: data.bookingTime,
            parseError: error instanceof Error ? error.message : String(error)
          } 
        },
        { status: 400 }
      );
    }
    
    // Find an available table for the party size
    const availableTables = await prisma.table.findMany({
      where: {
        capacity: {
          gte: parseInt(data.partySize),
        },
      },
      orderBy: {
        capacity: 'asc', // Get the smallest table that fits the party
      },
    });
    
    if (availableTables.length === 0) {
      return NextResponse.json(
        { error: "No tables available for this party size" },
        { status: 400 }
      );
    }
    
    // Set default duration if not provided
    const duration = data.duration || 120; // Default to 2 hours
    
    // Calculate booking end time
    const bookingEndTime = addMinutes(bookingTime, duration);
    
    // Check for booking conflicts for each table
    let selectedTable = null;
    
    for (const table of availableTables) {
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          tableId: table.tableId,
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
      
      if (conflictingBookings.length === 0) {
        selectedTable = table;
        break;
      }
    }
    
    if (!selectedTable) {
      return NextResponse.json(
        { error: "No tables available for this time slot" },
        { status: 409 }
      );
    }
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerName: data.customerName,
        partySize: parseInt(data.partySize),
        bookingTime: bookingTime,
        endTime: bookingEndTime,
        duration: duration,
        notes: data.notes || "",
        status: "pending", // External bookings start as pending
        tableId: selectedTable.tableId,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || "external",
      },
      include: {
        table: true,
      },
    });

    console.log("Created external booking:", JSON.stringify(booking, null, 2));

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating external booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}