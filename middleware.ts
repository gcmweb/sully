import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge, verifyTokenBasic } from './lib/auth-edge'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('[Middleware] Processing request for:', pathname)
  console.log('[Middleware] User-Agent:', request.headers.get('user-agent'))
  
  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    console.log('[Middleware] API route, allowing access')
    return NextResponse.next()
  }
  
  // Allow static files
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico') || pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname)
  
  if (isProtectedRoute) {
    console.log('[Middleware] Protected route detected:', pathname)
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    console.log('[Middleware] Token found:', !!token)
    console.log('[Middleware] All cookies:', request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`))
    
    if (!token) {
      console.log('[Middleware] No token, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    try {
      // Verify token using Edge Runtime compatible function
      let decoded = await verifyTokenEdge(token)
      
      // Fallback to basic verification if Edge verification fails
      if (!decoded) {
        decoded = verifyTokenBasic(token)
      }
      
      console.log('[Middleware] Token verification result:', !!decoded)
      
      if (!decoded) {
        console.log('[Middleware] Invalid token, redirecting to login')
        const response = NextResponse.redirect(new URL('/login', request.url))
        // Clear the invalid token
        response.cookies.set('auth-token', '', { maxAge: 0 })
        return response
      }
      
      console.log('[Middleware] Token valid, allowing access to:', pathname, 'for user:', decoded.userId)
      // Token is valid, allow access
      return NextResponse.next()
    } catch (error) {
      console.error('[Middleware] Token verification failed:', error)
      // Redirect to login if token verification fails
      const response = NextResponse.redirect(new URL('/login', request.url))
      // Clear the invalid token
      response.cookies.set('auth-token', '', { maxAge: 0 })
      return response
    }
  }
  
  // For public routes, check if user is already authenticated and redirect to dashboard
  if (isPublicRoute && pathname !== '/') {
    const token = request.cookies.get('auth-token')?.value
    console.log('[Middleware] Public route, token found:', !!token)
    
    if (token) {
      try {
        let decoded = await verifyTokenEdge(token)
        
        // Fallback to basic verification if Edge verification fails
        if (!decoded) {
          decoded = verifyTokenBasic(token)
        }
        
        if (decoded) {
          console.log('[Middleware] Valid token on public route, redirecting to dashboard')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (error) {
        console.log('[Middleware] Token verification failed on public route')
        // Token is invalid, continue to public route
      }
    }
  }
  
  console.log('[Middleware] No specific handling, allowing access to:', pathname)
  return NextResponse.next()
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
}