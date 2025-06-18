import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  console.log('[Auth] Hashing password')
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(password, salt)
  console.log('[Auth] Password hashed successfully')
  return hashedPassword
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  console.log('[Auth] Verifying password')
  const isValid = await bcrypt.compare(password, hashedPassword)
  console.log('[Auth] Password verification result:', isValid)
  return isValid
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  console.log('[Auth] Generating JWT token for user:', payload.userId)
  
  const token = jwt.sign(
    payload,
    JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'jwt-auth-app',
      audience: 'jwt-auth-app-users'
    }
  )
  
  console.log('[Auth] JWT token generated successfully')
  return token
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    console.log('[Auth] Verifying JWT token')
    
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'jwt-auth-app',
      audience: 'jwt-auth-app-users'
    }) as JWTPayload
    
    console.log('[Auth] JWT token verified successfully for user:', decoded.userId)
    return decoded
  } catch (error) {
    console.error('[Auth] JWT token verification failed:', error)
    return null
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  console.log('[Auth] Getting user by email:', email)
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log('[Auth] User found:', !!user)
    return user
  } catch (error) {
    console.error('[Auth] Error getting user by email:', error)
    return null
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  console.log('[Auth] Getting user by ID:', id)
  
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log('[Auth] User found by ID:', !!user)
    return user
  } catch (error) {
    console.error('[Auth] Error getting user by ID:', error)
    return null
  }
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string
  password: string
  name: string
  role?: 'USER' | 'ADMIN'
}) {
  console.log('[Auth] Creating new user:', data.email)
  
  try {
    const hashedPassword = await hashPassword(data.password)
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'USER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log('[Auth] User created successfully:', user.id)
    return user
  } catch (error) {
    console.error('[Auth] Error creating user:', error)
    throw error
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string) {
  console.log('[Auth] Authenticating user:', email)
  
  try {
    const user = await getUserByEmail(email)
    
    if (!user) {
      console.log('[Auth] User not found')
      return null
    }
    
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      console.log('[Auth] Invalid password')
      return null
    }
    
    console.log('[Auth] User authenticated successfully')
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error('[Auth] Error authenticating user:', error)
    return null
  }
}