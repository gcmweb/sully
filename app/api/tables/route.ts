import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET all tables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    
    let whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    const tables = await prisma.table.findMany({
      where: whereClause,
      orderBy: {
        tableId: "asc",
      },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// CREATE a new table
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.tableId || !data.capacity || !data.location) {
      return NextResponse.json(
        { error: "Missing required fields", details: { data } },
        { status: 400 }
      );
    }
    
    // Check if table with this ID already exists
    const existingTable = await prisma.table.findUnique({
      where: {
        tableId: parseInt(data.tableId),
      },
    });
    
    if (existingTable) {
      return NextResponse.json(
        { error: "Table with this ID already exists" },
        { status: 409 }
      );
    }
    
    // Create table
    const table = await prisma.table.create({
      data: {
        tableId: parseInt(data.tableId),
        capacity: parseInt(data.capacity),
        location: data.location,
        status: data.status || "available",
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}