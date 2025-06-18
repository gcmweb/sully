import { NextResponse } from "next/server";
import { authenticateUser, generateToken } from "@/lib/auth-helpers";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export async function POST(request) {
  try {
    console.log("[Login API] Starting login process");
    
    const body = await request.json();
    console.log("[Login API] Request body received:", { email: body.email, passwordLength: body.password?.length });
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log("[Login API] Validation failed:", validationResult.error.errors);
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { email, password } = validationResult.data;
    console.log("[Login API] Validation passed, attempting authentication for:", email);
    
    // Authenticate user
    const user = await authenticateUser(email, password);
    
    if (!user) {
      console.log("[Login API] Authentication failed for:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    
    console.log("[Login API] Authentication successful for user:", { id: user.id, email: user.email, role: user.role });
    
    // Generate JWT token
    const token = generateToken(user);
    console.log("[Login API] JWT token generated successfully");
    
    // Create response with token in httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
    // Set httpOnly cookie with token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    };
    
    console.log("[Login API] Setting cookie with options:", cookieOptions);
    response.cookies.set('auth-token', token, cookieOptions);
    
    console.log("[Login API] Login process completed successfully");
    return response;
  } catch (error) {
    console.error("[Login API] Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login", details: error.message },
      { status: 500 }
    );
  }
}