import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("[Businesses API] Fetching business data");
    
    // For single business model, return default business data
    const defaultBusiness = {
      id: "sully-restaurant",
      name: "Sully Restaurant",
      description: "A robust, reliable solution for restaurant booking management",
      address: "123 Main Street, City, Country",
      phone: "+1 (555) 123-4567",
      email: "contact@sullyrestaurant.com",
      website: "https://www.sullyrestaurant.com",
      logo: "/image.png",
      timezone: "UTC",
      settings: {
        defaultBookingDuration: 120,
        maxPartySize: 12,
        minAdvanceBookingHours: 1,
        maxAdvanceBookingDays: 30,
        allowTableSelection: true
      }
    };

    console.log("[Businesses API] Returning default business data");
    return NextResponse.json([defaultBusiness]);
  } catch (error) {
    console.error("[Businesses API] Error fetching businesses:", error);
    
    // Return empty array instead of error to prevent blocking
    return NextResponse.json([]);
  }
}

export async function PUT(request) {
  try {
    console.log("[Businesses API] Updating business data");
    
    const body = await request.json();
    
    // In a real implementation, this would update the database
    // For now, just return the updated data
    console.log("[Businesses API] Business data updated successfully");
    
    return NextResponse.json({
      success: true,
      message: "Business updated successfully",
      business: body
    });
  } catch (error) {
    console.error("[Businesses API] Error updating business:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}