import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Initialize the database with seed data while preserving user bookings
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preserveBookings = searchParams.get("preserveBookings") === "true";
    
    console.log(`Initializing database with preserveBookings=${preserveBookings}`);
    
    // Check if tables already exist
    const existingTables = await prisma.table.count();
    const existingBookings = await prisma.booking.count();
    
    // Backup existing bookings if we're preserving them
    let bookingsToRestore: any[] = [];
    if (preserveBookings && existingBookings > 0) {
      bookingsToRestore = await prisma.booking.findMany({
        include: {
          table: true,
        }
      });
      console.log(`Backed up ${bookingsToRestore.length} existing bookings`);
    }
    
    // Create tables if they don't exist or reset them
    if (existingTables === 0) {
      console.log("No existing tables found. Creating new tables...");
      
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
      
      for (const table of tables) {
        await prisma.table.create({
          data: table,
        });
      }
      
      console.log(`Created ${tables.length} tables`);
    } else {
      if (!preserveBookings) {
        console.log("Resetting existing tables to available status...");
        
        // Reset all tables to available status
        await prisma.table.updateMany({
          data: {
            status: "available",
          },
        });
      }
    }
    
    // Initialize opening hours if they don't exist
    const existingOpeningHours = await prisma.openingHours.count();
    
    if (existingOpeningHours === 0) {
      console.log("No existing opening hours found. Creating default opening hours...");
      
      // Create default opening hours for each day of the week
      const defaultOpeningHours = [];
      
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
      
      console.log(`Created default opening hours for all days of the week`);
    }
    
    // Handle bookings
    if (!preserveBookings) {
      console.log("Clearing existing bookings...");
      
      // Clear existing bookings
      await prisma.booking.deleteMany({});
      
      console.log("Existing bookings cleared");
    } else if (bookingsToRestore.length > 0) {
      console.log("Restoring backed up bookings...");
      
      // Update table status based on restored bookings
      for (const booking of bookingsToRestore) {
        if (booking.status === "confirmed") {
          const now = new Date();
          const bookingTime = new Date(booking.bookingTime);
          const endTime = new Date(booking.endTime);
          
          // If the booking is current (happening now), mark table as occupied
          if (now >= bookingTime && now <= endTime) {
            await prisma.table.update({
              where: {
                tableId: booking.tableId,
              },
              data: {
                status: "occupied",
              },
            });
          } 
          // If the booking is in the future, mark table as reserved
          else if (now < bookingTime) {
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
      }
      
      console.log("Restored bookings and updated table statuses");
    }
    
    return NextResponse.json({ 
      success: true, 
      message: preserveBookings 
        ? "Database initialized successfully while preserving existing bookings" 
        : "Database initialized successfully with fresh data",
      tablesCount: await prisma.table.count(),
      bookingsCount: await prisma.booking.count(),
      openingHoursCount: await prisma.openingHours.count()
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      { error: "Failed to initialize database", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}