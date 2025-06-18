import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

// GET report data
export async function GET(request: NextRequest) {
  try {
    console.log("[Reports API] Fetching report data");
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";
    
    console.log(`[Reports API] Requested period: ${period}`);
    
    // Get current date
    const now = new Date();
    
    // Define date ranges based on period
    let startDate: Date;
    let endDate: Date = endOfDay(now);
    
    switch (period) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "3months":
        startDate = startOfDay(subMonths(now, 3));
        break;
      case "all":
      default:
        // For "all", we'll use a very old date to get all bookings
        startDate = new Date(2000, 0, 1);
        break;
    }
    
    console.log(`[Reports API] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Get all bookings within the date range
    const bookings = await prisma.booking.findMany({
      where: {
        bookingTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        table: true,
      },
    });
    
    console.log(`[Reports API] Found ${bookings.length} bookings in the specified period`);
    
    // Calculate statistics
    const totalBookings = bookings.length;
    
    // Count bookings by status
    const confirmedBookings = bookings.filter(booking => booking.status === "confirmed").length;
    const pendingBookings = bookings.filter(booking => booking.status === "pending").length;
    const cancelledBookings = bookings.filter(booking => booking.status === "cancelled").length;
    
    console.log(`[Reports API] Status breakdown - Confirmed: ${confirmedBookings}, Pending: ${pendingBookings}, Cancelled: ${cancelledBookings}`);
    
    // Calculate total guests
    const totalGuests = bookings.reduce((sum, booking) => sum + booking.partySize, 0);
    
    // Calculate average party size (avoid division by zero)
    const averagePartySize = totalBookings > 0 ? (totalGuests / totalBookings).toFixed(1) : "0";
    
    // Count bookings by table
    const bookingsByTable = bookings.reduce((acc: Record<string, number>, booking) => {
      const tableId = booking.tableId.toString();
      acc[tableId] = (acc[tableId] || 0) + 1;
      return acc;
    }, {});
    
    // Get all tables for reference
    const allTables = await prisma.table.findMany({
      orderBy: {
        tableId: 'asc',
      },
    });
    
    // Format table data for the chart
    const tableData = allTables.map(table => {
      const tableId = table.tableId.toString();
      return {
        id: tableId,
        label: `Table ${tableId}`,
        value: bookingsByTable[tableId] || 0,
        capacity: table.capacity,
        location: table.location,
      };
    });
    
    // Count bookings by time of day
    const morningBookings = bookings.filter(booking => {
      const hour = new Date(booking.bookingTime).getHours();
      return hour >= 6 && hour < 12;
    }).length;
    
    const afternoonBookings = bookings.filter(booking => {
      const hour = new Date(booking.bookingTime).getHours();
      return hour >= 12 && hour < 17;
    }).length;
    
    const eveningBookings = bookings.filter(booking => {
      const hour = new Date(booking.bookingTime).getHours();
      return hour >= 17 && hour < 22;
    }).length;
    
    const nightBookings = bookings.filter(booking => {
      const hour = new Date(booking.bookingTime).getHours();
      return hour >= 22 || hour < 6;
    }).length;
    
    console.log(`[Reports API] Time breakdown - Morning: ${morningBookings}, Afternoon: ${afternoonBookings}, Evening: ${eveningBookings}, Night: ${nightBookings}`);
    
    // Count bookings by day of week
    const bookingsByDay = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
    
    bookings.forEach(booking => {
      const dayOfWeek = new Date(booking.bookingTime).getDay(); // 0 = Sunday, 6 = Saturday
      bookingsByDay[dayOfWeek]++;
    });
    
    const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    const dayData = bookingsByDay.map((count, index) => ({
      day: dayLabels[index],
      bookings: count,
    }));
    
    console.log(`[Reports API] Day breakdown:`, dayData);
    
    // Count bookings by source
    const internalBookings = bookings.filter(booking => booking.source === "internal").length;
    const externalBookings = bookings.filter(booking => booking.source === "external").length;
    const embeddedFormBookings = bookings.filter(booking => booking.source === "embedded_form").length;
    
    console.log(`[Reports API] Source breakdown - Internal: ${internalBookings}, External: ${externalBookings}, Embedded Form: ${embeddedFormBookings}`);
    
    // Return report data
    return NextResponse.json({
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalGuests,
      averagePartySize,
      tableData,
      timeOfDayData: [
        { name: "Morning (6am-12pm)", value: morningBookings },
        { name: "Afternoon (12pm-5pm)", value: afternoonBookings },
        { name: "Evening (5pm-10pm)", value: eveningBookings },
        { name: "Night (10pm-6am)", value: nightBookings },
      ],
      dayOfWeekData: dayData,
      sourceData: [
        { name: "Internal", value: internalBookings },
        { name: "External", value: externalBookings },
        { name: "Embedded Form", value: embeddedFormBookings },
      ],
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Reports API] Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}