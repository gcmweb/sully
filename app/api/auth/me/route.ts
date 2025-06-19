
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth'

// Force this API route to use Node.js runtime instead of Edge Runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('[Me API] Starting user verification process')
    console.log('[Me API] Request URL:', request.url)
    console.log('[Me API] Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Get all cookies from the request
    const cookies = request.cookies
    console.log('[Me API] All cookies:', cookies.getAll())
    
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value
    console.log('[Me API] Auth token found:', !!token)
    console.log('[Me API] Auth token length:', token?.length || 0)
    
    if (!token) {
      console.log('[Me API] No authentication token found in cookies')
      return NextResponse.json(
        { 
          success: false,
          error: 'No authentication token found',
          debug: {
            cookiesFound: cookies.getAll().map(c => c.name),
            expectedCookie: 'auth-token'
          }
        },
        { status: 401 }
      )
    }
    
    // Verify token
    console.log('[Me API] Verifying token...')
    const decoded = verifyToken(token)
    
    if (!decoded) {
      console.log('[Me API] Invalid authentication token')
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid authentication token',
          debug: {
            tokenLength: token.length,
            tokenStart: token.substring(0, 10) + '...'
          }
        },
        { status: 401 }
      )
    }
    
    console.log('[Me API] Token verified successfully for user:', decoded.userId)
    
    // Get user from database
    const user = await getUserById(decoded.userId)
    
    if (!user) {
      console.log('[Me API] User not found for ID:', decoded.userId)
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          debug: {
            userId: decoded.userId
          }
        },
        { status: 404 }
      )
    }
    
    console.log('[Me API] User found and verified:', user.email)
    
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
    })
    
  } catch (error: any) {
    console.error('[Me API] Get current user error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred while fetching user data',
        details: error.message
      },
      { status: 500 }
    )
  }
}
