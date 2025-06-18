import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth-helpers';

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/bookings',
  '/tables',
  '/reports',
  '/settings',
  '/embed'
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/embed-form',
  '/booking-form'
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  console.log("[Middleware] Processing request for:", pathname);
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    console.log("[Middleware] Public route, allowing access");
    return NextResponse.next();
  }
  
  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    console.log("[Middleware] API route, allowing access");
    return NextResponse.next();
  }
  
  // Allow static files
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    console.log("[Middleware] Protected route detected:", pathname);
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log("[Middleware] Token found:", !!token);
    
    if (!token) {
      console.log("[Middleware] No token, redirecting to login");
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      console.log("[Middleware] Token verification result:", !!decoded);
      
      if (!decoded) {
        console.log("[Middleware] Invalid token, redirecting to login");
        const response = NextResponse.redirect(new URL('/login', request.url));
        // Clear the invalid token
        response.cookies.set('auth-token', '', { maxAge: 0 });
        return response;
      }
      
      console.log("[Middleware] Token valid, allowing access to:", pathname, "for user:", decoded.userId);
      // Token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      console.error('[Middleware] Token verification failed:', error);
      // Redirect to login if token verification fails
      const response = NextResponse.redirect(new URL('/login', request.url));
      // Clear the invalid token
      response.cookies.set('auth-token', '', { maxAge: 0 });
      return response;
    }
  }
  
  // For the root path, redirect to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    console.log("[Middleware] Root path detected");
    
    const token = request.cookies.get('auth-token')?.value;
    console.log("[Middleware] Token found for root:", !!token);
    
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          console.log("[Middleware] Valid token, redirecting to dashboard");
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        console.log("[Middleware] Token verification failed for root");
        // Token is invalid, continue to login redirect
      }
    }
    
    console.log("[Middleware] No valid token, redirecting to login");
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  console.log("[Middleware] No specific handling, allowing access to:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};