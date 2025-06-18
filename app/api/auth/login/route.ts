import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateUser, generateToken } from '@/lib/auth'
import { getCookieConfig } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    console.log('[Login API] Starting login process')
    console.log('[Login API] Request headers:', Object.fromEntries(request.headers.entries()))
    console.log('[Login API] Request URL:', request.url)
    
    const body = await request.json()
    console.log('[Login API] Request body received for email:', body.email)
    
    // Validate input
    const validationResult = loginSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('[Login API] Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }
    
    const { email, password } = validationResult.data
    console.log('[Login API] Validation passed, attempting authentication for:', email)
    
    // Authenticate user
    const user = await authenticateUser(email, password)
    
    if (!user) {
      console.log('[Login API] Authentication failed for:', email)
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email or password' 
        },
        { status: 401 }
      )
    }
    
    console.log('[Login API] Authentication successful for user:', user.id)
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
    
    console.log('[Login API] JWT token generated successfully')
    
    // Get cookie configuration
    const cookieConfig = getCookieConfig()
    console.log('[Login API] Cookie configuration:', cookieConfig)
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
    
    // Set auth token cookie
    response.cookies.set('auth-token', token, cookieConfig)
    
    console.log('[Login API] Auth token cookie set successfully')
    console.log('[Login API] Response headers:', Object.fromEntries(response.headers.entries()))
    
    return response
    
  } catch (error: any) {
    console.error('[Login API] Login error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred during login',
        details: error.message
      },
      { status: 500 }
    )
  }
}