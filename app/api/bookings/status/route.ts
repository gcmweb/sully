import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Update booking status
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.bookingId || !data.status) {
      return NextResponse.json(
        { error: "Missing required fields: bookingId and status" },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!["pending", "confirmed", "cancelled"].includes(data.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: pending, confirmed, cancelled" },
        { status: 400 }
      );
    }
    
    // Find the current booking to get the table
    const currentBooking = await prisma.booking.findUnique({
      where: {
        bookingId: data.bookingId,
      },
    });
    
    if (!currentBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Update booking status
    const booking = await prisma.booking.update({
      where: {
        bookingId: data.bookingId,
      },
      data: {
        status: data.status,
      },
      include: {
        table: true,
      },
    });
    
    // Update table status based on booking status
    let tableStatus = "available";
    
    if (data.status === "confirmed") {
      tableStatus = "reserved";
    } else if (data.status === "cancelled") {
      tableStatus = "available";
    }
    
    await prisma.table.update({
      where: {
        tableId: currentBooking.tableId,
      },
      data: {
        status: tableStatus,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Failed to update booking status", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}