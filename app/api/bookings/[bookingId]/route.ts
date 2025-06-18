import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";

// GET a specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: {
        bookingId: params.bookingId,
      },
      include: {
        table: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// UPDATE a booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const data = await request.json();
    
    // Find the current booking to get the current table
    const currentBooking = await prisma.booking.findUnique({
      where: {
        bookingId: params.bookingId,
      },
    });
    
    if (!currentBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Check if table is being changed
    const isTableChanged = data.tableId && parseInt(data.tableId) !== currentBooking.tableId;
    
    // If table is changed, check if new table exists
    if (isTableChanged) {
      const newTable = await prisma.table.findUnique({
        where: {
          tableId: parseInt(data.tableId),
        },
      });
      
      if (!newTable) {
        return NextResponse.json(
          { error: "New table not found" },
          { status: 404 }
        );
      }
      
      // Check if new table capacity is sufficient
      if (newTable.capacity < (data.partySize ? parseInt(data.partySize) : currentBooking.partySize)) {
        return NextResponse.json(
          { error: "New table capacity is not sufficient for the party size" },
          { status: 400 }
        );
      }
    }
    
    // Parse booking time and calculate end time
    let bookingTime: Date | undefined;
    let endTime: Date | undefined;
    
    if (data.bookingTime) {
      bookingTime = new Date(data.bookingTime);
      
      // If duration is provided, calculate end time
      if (data.duration) {
        endTime = addMinutes(bookingTime, parseInt(data.duration));
      } else if (currentBooking.duration) {
        // Use existing duration if not provided
        endTime = addMinutes(bookingTime, currentBooking.duration);
      }
    }
    
    // Check for booking conflicts if time or table is changed
    if ((bookingTime || isTableChanged) && endTime) {
      const tableId = isTableChanged ? parseInt(data.tableId) : currentBooking.tableId;
      
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          tableId: tableId,
          status: { in: ["confirmed", "pending"] },
          NOT: {
            bookingId: params.bookingId, // Exclude current booking
          },
          AND: [
            {
              bookingTime: {
                lt: endTime,
              },
            },
            {
              endTime: {
                gt: bookingTime || currentBooking.bookingTime,
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
              requestedTime: bookingTime || currentBooking.bookingTime,
              requestedEndTime: endTime
            } 
          },
          { status: 409 }
        );
      }
    }
    
    // Prepare data for update
    const updateData: any = {};
    
    if (data.customerName) updateData.customerName = data.customerName;
    if (data.partySize) updateData.partySize = parseInt(data.partySize);
    if (bookingTime) updateData.bookingTime = bookingTime;
    if (endTime) updateData.endTime = endTime;
    if (data.duration) updateData.duration = parseInt(data.duration);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;
    if (data.tableId) updateData.tableId = parseInt(data.tableId);
    
    // Update booking
    const booking = await prisma.booking.update({
      where: {
        bookingId: params.bookingId,
      },
      data: updateData,
      include: {
        table: true,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE a booking (soft delete by updating status to cancelled)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    // Find the current booking to get the table
    const currentBooking = await prisma.booking.findUnique({
      where: {
        bookingId: params.bookingId,
      },
    });
    
    if (!currentBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Update booking status to cancelled
    const booking = await prisma.booking.update({
      where: {
        bookingId: params.bookingId,
      },
      data: {
        status: "cancelled",
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}