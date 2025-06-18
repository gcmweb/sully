import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sully-booking-system-secret-key-development';

/**
 * Hash a password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
export async function hashPassword(password) {
  try {
    console.log("[Auth Helpers] Hashing password");
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    console.log("[Auth Helpers] Password hashed successfully");
    return hash;
  } catch (error) {
    console.error('[Auth Helpers] Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * @param {string} password - The plain text password
 * @param {string} hash - The hashed password
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
export async function verifyPassword(password, hash) {
  try {
    console.log("[Auth Helpers] Verifying password");
    const isValid = await bcrypt.compare(password, hash);
    console.log("[Auth Helpers] Password verification result:", isValid);
    return isValid;
  } catch (error) {
    console.error('[Auth Helpers] Error verifying password:', error);
    return false;
  }
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - The user object
 * @returns {string} The JWT token
 */
export function generateToken(user) {
  try {
    console.log("[Auth Helpers] Generating token for user:", user.id);
    
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    console.log("[Auth Helpers] Token generated successfully");
    return token;
  } catch (error) {
    console.error('[Auth Helpers] Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} The decoded token payload if valid, null otherwise
 */
export function verifyToken(token) {
  try {
    console.log("[Auth Helpers] Verifying token");
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("[Auth Helpers] Token verified successfully for user:", decoded.userId);
    return decoded;
  } catch (error) {
    console.error('[Auth Helpers] Error verifying token:', error);
    return null;
  }
}

/**
 * Get user from database by email
 * @param {string} email - The user's email
 * @returns {Promise<Object|null>} The user object or null if not found
 */
export async function getUserByEmail(email) {
  try {
    console.log("[Auth Helpers] Getting user by email:", email);
    
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
    });
    
    console.log("[Auth Helpers] User found:", !!user);
    return user;
  } catch (error) {
    console.error('[Auth Helpers] Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user from database by ID
 * @param {number} id - The user's ID
 * @returns {Promise<Object|null>} The user object or null if not found
 */
export async function getUserById(id) {
  try {
    console.log("[Auth Helpers] Getting user by ID:", id);
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log("[Auth Helpers] User found by ID:", !!user);
    return user;
  } catch (error) {
    console.error('[Auth Helpers] Error getting user by ID:', error);
    return null;
  }
}

/**
 * Create a new user in the database
 * @param {Object} userData - The user data
 * @returns {Promise<Object>} The created user object
 */
export async function createUser(userData) {
  try {
    console.log("[Auth Helpers] Creating user:", userData.email);
    
    const hashedPassword = await hashPassword(userData.password);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'STAFF'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log("[Auth Helpers] User created successfully:", user.id);
    return user;
  } catch (error) {
    console.error('[Auth Helpers] Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

/**
 * Authenticate a user with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object|null>} The user object if authentication succeeds, null otherwise
 */
export async function authenticateUser(email, password) {
  try {
    console.log("[Auth Helpers] Authenticating user:", email);
    
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.log("[Auth Helpers] User not found:", email);
      return null;
    }
    
    console.log("[Auth Helpers] User found, verifying password");
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      console.log("[Auth Helpers] Password verification failed");
      return null;
    }
    
    console.log("[Auth Helpers] Authentication successful");
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('[Auth Helpers] Error authenticating user:', error);
    return null;
  }
}

/**
 * Get user from token in request headers
 * @param {Request} request - The request object
 * @returns {Promise<Object|null>} The user object if token is valid, null otherwise
 */
export async function getUserFromRequest(request) {
  try {
    console.log("[Auth Helpers] Getting user from request");
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("[Auth Helpers] No valid authorization header");
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log("[Auth Helpers] Invalid token in request");
      return null;
    }
    
    const user = await getUserById(decoded.userId);
    console.log("[Auth Helpers] User from request:", !!user);
    return user;
  } catch (error) {
    console.error('[Auth Helpers] Error getting user from request:', error);
    return null;
  }
}