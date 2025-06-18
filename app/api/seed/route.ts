import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";

// Seed the database with initial data
export async function POST(request: NextRequest) {
  try {
    // Create tables
    const tables = [
      { tableId: 1, capacity: 2, location: "Window", status: "available" },
      { tableId: 2, capacity: 4, location: "Center", status: "available" },
      { tableId: 3, capacity: 4, location: "Window", status: "available" },
      { tableId: 4, capacity: 6, location: "Corner", status: "available" },
      { tableId: 5, capacity: 8, location: "Private Room", status: "available" },
      { tableId: 6, capacity: 2, location: "Bar", status: "available" },
      { tableId: 7, capacity: 4, location: "Patio", status: "available" },
      { tableId: 8, capacity: 6, location: "Garden", status: "available" },
    ];
    
    // Clear existing data
    await prisma.booking.deleteMany({});
    await prisma.table.deleteMany({});
    await prisma.openingHours.deleteMany({});
    
    // Create tables
    for (const table of tables) {
      await prisma.table.create({
        data: table,
      });
    }
    
    // Create default opening hours
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
    
    // Create bookings
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const bookings = [
      { 
        customerName: "John Doe", 
        tableId: 3, 
        partySize: 4, 
        bookingTime: new Date(today.setHours(19, 0, 0, 0)), 
        duration: 120,
        notes: "Window seat preferred",
        status: "confirmed" 
      },
      { 
        customerName: "Jane Smith", 
        tableId: 1, 
        partySize: 2, 
        bookingTime: new Date(today.setHours(18, 30, 0, 0)), 
        duration: 90,
        notes: "Anniversary celebration",
        status: "confirmed" 
      },
      { 
        customerName: "Robert Johnson", 
        tableId: 5, 
        partySize: 6, 
        bookingTime: new Date(today.setHours(20, 0, 0, 0)), 
        duration: 150,
        notes: "Birthday party",
        status: "pending" 
      },
      { 
        customerName: "Emily Davis", 
        tableId: 2, 
        partySize: 3, 
        bookingTime: new Date(today.setHours(19, 30, 0, 0)), 
        duration: 120,
        notes: "Allergic to nuts",
        status: "confirmed" 
      },
      { 
        customerName: "Michael Wilson", 
        tableId: 4, 
        partySize: 5, 
        bookingTime: new Date(today.setHours(18, 0, 0, 0)), 
        duration: 120,
        notes: "",
        status: "cancelled" 
      },
      { 
        customerName: "Sarah Brown", 
        tableId: 6, 
        partySize: 2, 
        bookingTime: new Date(tomorrow.setHours(18, 0, 0, 0)), 
        duration: 90,
        notes: "Quiet area preferred",
        status: "confirmed" 
      },
      { 
        customerName: "David Miller", 
        tableId: 7, 
        partySize: 4, 
        bookingTime: new Date(tomorrow.setHours(19, 0, 0, 0)), 
        duration: 120,
        notes: "",
        status: "confirmed" 
      },
      { 
        customerName: "Jennifer Taylor", 
        tableId: 8, 
        partySize: 6, 
        bookingTime: new Date(tomorrow.setHours(20, 0, 0, 0)), 
        duration: 150,
        notes: "Business dinner",
        status: "pending" 
      },
    ];
    
    for (const booking of bookings) {
      // Calculate end time based on booking time and duration
      const endTime = addMinutes(booking.bookingTime, booking.duration);
      
      await prisma.booking.create({
        data: {
          ...booking,
          endTime: endTime
        },
      });
      
      // Update table status based on booking status
      if (booking.status === "confirmed") {
        await prisma.table.update({
          where: {
            tableId: booking.tableId,
          },
          data: {
            status: "reserved",
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}