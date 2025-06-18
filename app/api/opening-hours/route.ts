import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET all opening hours
export async function GET(request: NextRequest) {
  try {
    // Get opening hours for all days
    const openingHours = await prisma.openingHours.findMany({
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    // If no opening hours exist, create default ones
    if (openingHours.length === 0) {
      const defaultOpeningHours = [];
      
      // Create default opening hours for each day of the week
      for (let i = 0; i < 7; i++) {
        const isWeekend = i === 0 || i === 6; // Sunday or Saturday
        
        defaultOpeningHours.push({
          dayOfWeek: i,
          isOpen: true,
          openTime: isWeekend ? "11:00" : "12:00",
          closeTime: isWeekend ? "22:00" : "23:00",
        });
      }
      
      // Insert default opening hours
      await prisma.openingHours.createMany({
        data: defaultOpeningHours,
      });
      
      // Return the newly created opening hours
      return NextResponse.json(defaultOpeningHours);
    }

    return NextResponse.json(openingHours);
  } catch (error) {
    console.error("Error fetching opening hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening hours", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// UPDATE opening hours
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!Array.isArray(data) || data.length !== 7) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of 7 opening hours objects." },
        { status: 400 }
      );
    }
    
    // Validate each opening hours object
    for (const hours of data) {
      if (
        typeof hours.dayOfWeek !== 'number' ||
        hours.dayOfWeek < 0 || 
        hours.dayOfWeek > 6 ||
        typeof hours.isOpen !== 'boolean' ||
        typeof hours.openTime !== 'string' ||
        typeof hours.closeTime !== 'string'
      ) {
        return NextResponse.json(
          { 
            error: "Invalid opening hours data", 
            details: { 
              invalidEntry: hours,
              expectedFormat: {
                dayOfWeek: "number (0-6)",
                isOpen: "boolean",
                openTime: "string (HH:MM)",
                closeTime: "string (HH:MM)"
              }
            }
          },
          { status: 400 }
        );
      }
    }
    
    // Update opening hours for each day
    const updatedHours = [];
    
    for (const hours of data) {
      const updatedHour = await prisma.openingHours.upsert({
        where: {
          dayOfWeek: hours.dayOfWeek,
        },
        update: {
          isOpen: hours.isOpen,
          openTime: hours.openTime,
          closeTime: hours.closeTime,
        },
        create: {
          dayOfWeek: hours.dayOfWeek,
          isOpen: hours.isOpen,
          openTime: hours.openTime,
          closeTime: hours.closeTime,
        },
      });
      
      updatedHours.push(updatedHour);
    }

    return NextResponse.json(updatedHours);
  } catch (error) {
    console.error("Error updating opening hours:", error);
    return NextResponse.json(
      { error: "Failed to update opening hours", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}