import { NextRequest, NextResponse } from 'next/server'
import { getCookieConfig } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    console.log('[Logout API] Starting logout process')
    
    const cookieConfig = getCookieConfig()
    
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })
    
    // Clear the auth token cookie
    response.cookies.set('auth-token', '', {
      ...cookieConfig,
      maxAge: 0 // Expire immediately
    })
    
    console.log('[Logout API] Auth token cookie cleared')
    
    return response
    
  } catch (error: any) {
    console.error('[Logout API] Logout error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred during logout',
        details: error.message
      },
      { status: 500 }
    )
  }
}