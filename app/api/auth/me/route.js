
import { NextResponse } from "next/server";
import { verifyToken, getUserById } from "@/lib/auth-helpers";

// Force this API route to use Node.js runtime instead of Edge Runtime
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    console.log("[Me API] Starting user verification process");
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log("[Me API] Auth token found:", !!token);
    
    if (!token) {
      console.log("[Me API] No authentication token found");
      return NextResponse.json(
        { error: "No authentication token found" },
        { status: 401 }
      );
    }
    
    // Verify token
    console.log("[Me API] Verifying token...");
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log("[Me API] Invalid authentication token");
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }
    
    console.log("[Me API] Token verified successfully for user:", decoded.userId);
    
    // Get user from database
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      console.log("[Me API] User not found for ID:", decoded.userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    console.log("[Me API] User found and verified:", user.email);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error) {
    console.error("[Me API] Get current user error:", error);
    return NextResponse.json(
      { 
        error: "An error occurred while fetching user data",
        details: error.message
      },
      { status: 500 }
    );
  }
}
