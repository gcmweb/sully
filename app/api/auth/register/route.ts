
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createUser } from '@/lib/auth'
import { getCookieConfig } from '@/lib/utils'

// Force this API route to use Node.js runtime instead of Edge Runtime
export const runtime = 'nodejs'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['USER', 'ADMIN']).optional().default('USER')
})

export async function POST(request: NextRequest) {
  try {
    console.log('[Register API] Starting registration process')
    
    const body = await request.json()
    console.log('[Register API] Request body received for email:', body.email)
    
    // Validate input
    const validationResult = registerSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('[Register API] Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }
    
    const { email, password, name, role } = validationResult.data
    console.log('[Register API] Validation passed for:', email)
    
    // Create user
    const user = await createUser({
      email,
      password,
      name,
      role
    })
    
    console.log('[Register API] User created successfully:', user.id)
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('[Register API] Registration error:', error)
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email already exists' 
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create user',
        details: error.message
      },
      { status: 500 }
    )
  }
}
