import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET a specific table
export async function GET(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    const tableId = parseInt(params.tableId);
    
    if (isNaN(tableId)) {
      return NextResponse.json(
        { error: "Invalid table ID" },
        { status: 400 }
      );
    }
    
    const table = await prisma.table.findUnique({
      where: {
        tableId: tableId,
      },
      include: {
        bookings: {
          where: {
            status: { in: ["confirmed", "pending"] },
          },
          orderBy: {
            bookingTime: "asc",
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error fetching table:", error);
    return NextResponse.json(
      { error: "Failed to fetch table", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// UPDATE a table
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    const tableId = parseInt(params.tableId);
    
    if (isNaN(tableId)) {
      return NextResponse.json(
        { error: "Invalid table ID" },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: {
        tableId: tableId,
      },
    });
    
    if (!existingTable) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }
    
    // Prepare data for update
    const updateData: any = {};
    
    if (data.capacity) updateData.capacity = parseInt(data.capacity);
    if (data.location) updateData.location = data.location;
    if (data.status) updateData.status = data.status;
    
    // Update table
    const table = await prisma.table.update({
      where: {
        tableId: tableId,
      },
      data: updateData,
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Failed to update table", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    const tableId = parseInt(params.tableId);
    
    if (isNaN(tableId)) {
      return NextResponse.json(
        { error: "Invalid table ID" },
        { status: 400 }
      );
    }
    
    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: {
        tableId: tableId,
      },
      include: {
        bookings: {
          where: {
            status: { in: ["confirmed", "pending"] },
          },
        },
      },
    });
    
    if (!existingTable) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }
    
    // Check if table has active bookings
    if (existingTable.bookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete table with active bookings" },
        { status: 400 }
      );
    }
    
    // Delete table
    await prisma.table.delete({
      where: {
        tableId: tableId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Failed to delete table", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}