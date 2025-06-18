import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addMinutes, parseISO, startOfDay, endOfDay, addDays } from "date-fns";

export const dynamic = "force-dynamic";

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const period = searchParams.get("period");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    let whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.bookingTime = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate && endDate) {
      // For date range queries (used by calendar)
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      
      console.log(`[API] Filtering bookings between ${parsedStartDate.toISOString()} and ${parsedEndDate.toISOString()}`);
      
      whereClause.bookingTime = {
        gte: parsedStartDate,
        lte: parsedEndDate,
      };
    } else if (period) {
      // Handle different time periods
      const now = new Date();
      
      switch (period) {
        case "today": {
          // Today should strictly include only bookings for the current day
          const todayStart = startOfDay(now);
          const todayEnd = endOfDay(now);
          
          console.log(`[API] Filtering TODAY bookings between ${todayStart.toISOString()} and ${todayEnd.toISOString()}`);
          
          whereClause.bookingTime = {
            gte: todayStart,
            lte: todayEnd,
          };
          break;
        }
          
        case "future": {
          // Future means starting from tomorrow
          const tomorrowStart = startOfDay(addDays(now, 1));
          
          console.log(`[API] Filtering FUTURE bookings from ${tomorrowStart.toISOString()}`);
          
          whereClause.bookingTime = {
            gte: tomorrowStart,
          };
          break;
        }
          
        case "past": {
          // Past means before today
          const todayStart = startOfDay(now);
          
          console.log(`[API] Filtering PAST bookings before ${todayStart.toISOString()}`);
          
          whereClause.bookingTime = {
            lt: todayStart,
          };
          break;
        }
          
        case "week": {
          // Next 7 days including today
          const weekStart = startOfDay(now);
          const weekEnd = endOfDay(addDays(now, 6)); // 7 days total (today + 6 more days)
          
          console.log(`[API] Filtering WEEK bookings between ${weekStart.toISOString()} and ${weekEnd.toISOString()}`);
          
          whereClause.bookingTime = {
            gte: weekStart,
            lte: weekEnd,
          };
          break;
        }
          
        case "month": {
          // Next 30 days including today
          const monthStart = startOfDay(now);
          const monthEnd = endOfDay(addDays(now, 29)); // 30 days total (today + 29 more days)
          
          console.log(`[API] Filtering MONTH bookings between ${monthStart.toISOString()} and ${monthEnd.toISOString()}`);
          
          whereClause.bookingTime = {
            gte: monthStart,
            lte: monthEnd,
          };
          break;
        }
          
        case "upcoming": {
          // Upcoming means today and future (all future bookings including today)
          const todayStart = startOfDay(now);
          
          console.log(`[API] Filtering UPCOMING bookings from ${todayStart.toISOString()}`);
          
          whereClause.bookingTime = {
            gte: todayStart,
          };
          
          // Only include confirmed and pending bookings for upcoming
          whereClause.status = {
            in: ["confirmed", "pending"]
          };
          break;
        }
      }
    }
    
    console.log("[API] Fetching bookings with where clause:", JSON.stringify(whereClause, null, 2));
    
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        table: true,
      },
      orderBy: {
        bookingTime: "asc",
      },
    });

    console.log(`[API] Found ${bookings.length} bookings`);
    
    // Additional logging to verify the bookings returned
    if (period === "today" || period === "upcoming") {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      
      // Log a sample of bookings to verify they're in the correct category
      const sampleSize = Math.min(3, bookings.length);
      for (let i = 0; i < sampleSize; i++) {
        const booking = bookings[i];
        const bookingTime = new Date(booking.bookingTime);
        const isToday = bookingTime >= todayStart && bookingTime <= todayEnd;
        const isFuture = bookingTime > todayEnd;
        
        console.log(`[API] Sample booking ${i+1}/${sampleSize}:`, {
          id: booking.id,
          customerName: booking.customerName,
          bookingTime: bookingTime.toISOString(),
          isToday,
          isFuture,
          period
        });
      }
    }
    
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("[API] Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// CREATE a new booking
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log("[API] Creating booking with data:", JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.customerName || !data.partySize || !data.bookingTime || !data.tableId || !data.duration) {
      return NextResponse.json(
        { error: "Missing required fields", details: { data } },
        { status: 400 }
      );
    }
    
    // Check if table exists
    const table = await prisma.table.findUnique({
      where: {
        tableId: parseInt(data.tableId),
      },
    });
    
    if (!table) {
      return NextResponse.json(
        { error: "Table not found", details: { tableId: data.tableId } },
        { status: 404 }
      );
    }
    
    // Check if table capacity is sufficient
    if (table.capacity < parseInt(data.partySize)) {
      return NextResponse.json(
        { 
          error: "Table capacity is not sufficient for the party size", 
          details: { 
            tableCapacity: table.capacity, 
            partySize: data.partySize 
          } 
        },
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
      
      console.log("[API] Parsed booking time:", bookingTime.toISOString());
    } catch (error) {
      console.error("[API] Error parsing booking time:", error);
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
    
    // Check if the booking time is within opening hours
    const dayOfWeek = bookingTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
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
    
    // Convert booking time to hours and minutes for comparison
    const bookingHour = bookingTime.getHours();
    const bookingMinute = bookingTime.getMinutes();
    const bookingTimeInMinutes = bookingHour * 60 + bookingMinute;
    
    // Parse opening hours
    const [openHour, openMinute] = openingHours.openTime.split(':').map(Number);
    const openTimeInMinutes = openHour * 60 + openMinute;
    
    const [closeHour, closeMinute] = openingHours.closeTime.split(':').map(Number);
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    
    // Check if booking time is within opening hours
    if (bookingTimeInMinutes < openTimeInMinutes || bookingTimeInMinutes > closeTimeInMinutes - parseInt(data.duration)) {
      return NextResponse.json(
        { 
          error: "Booking time is outside of opening hours or too close to closing time", 
          details: { 
            bookingTime: `${bookingHour}:${bookingMinute}`,
            openingTime: openingHours.openTime,
            closingTime: openingHours.closeTime,
            duration: data.duration
          } 
        },
        { status: 400 }
      );
    }
    
    // Calculate booking end time
    const bookingEndTime = addMinutes(bookingTime, parseInt(data.duration));
    
    // Check for booking conflicts - only check for overlapping time slots
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        tableId: parseInt(data.tableId),
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
    
    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { 
          error: "Table is already booked for this time slot", 
          details: { 
            conflictingBookings,
            requestedTime: bookingTime,
            requestedEndTime: bookingEndTime
          } 
        },
        { status: 409 }
      );
    }
    
    // Create booking with explicit end time
    const booking = await prisma.booking.create({
      data: {
        customerName: data.customerName,
        partySize: parseInt(data.partySize),
        bookingTime: bookingTime,
        endTime: bookingEndTime,
        duration: parseInt(data.duration),
        notes: data.notes || "",
        status: data.status || "pending",
        tableId: parseInt(data.tableId),
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || "internal",
      },
      include: {
        table: true,
      },
    });

    console.log("[API] Created booking:", JSON.stringify(booking, null, 2));

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}