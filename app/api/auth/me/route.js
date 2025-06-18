import { NextResponse } from "next/server";
import { verifyToken, getUserById } from "@/lib/auth-helpers";

export async function GET(request) {
  try {
    console.log("[Me API] Starting user verification process");
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log("[Me API] Token found:", !!token);
    
    if (!token) {
      console.log("[Me API] No authentication token found");
      return NextResponse.json(
        { error: "No authentication token found" },
        { status: 401 }
      );
    }
    
    // Verify token
    const decoded = verifyToken(token);
    console.log("[Me API] Token verification result:", !!decoded);
    
    if (!decoded) {
      console.log("[Me API] Invalid authentication token");
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }
    
    console.log("[Me API] Token decoded successfully for user ID:", decoded.userId);
    
    // Get user from database
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      console.log("[Me API] User not found for ID:", decoded.userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    console.log("[Me API] User found:", { id: user.id, email: user.email, role: user.role });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("[Me API] Get current user error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user data", details: error.message },
      { status: 500 }
    );
  }
}