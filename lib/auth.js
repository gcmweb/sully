import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Secret key for JWT signing - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'sully-booking-system-secret-key';

/**
 * Read user data from JSON file
 * @returns {Array} Array of user objects
 */
export function getUsers() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading users data:', error);
    return [];
  }
}

/**
 * Read business data from JSON file
 * @returns {Array} Array of business objects
 */
export function getBusinesses() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'businesses.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading businesses data:', error);
    return [];
  }
}

/**
 * Get a business by ID
 * @param {string} businessId - The business ID to look up
 * @returns {Object|null} The business object or null if not found
 */
export function getBusinessById(businessId) {
  try {
    const businesses = getBusinesses();
    return businesses.find(business => business.id === businessId) || null;
  } catch (error) {
    console.error('Error getting business by ID:', error);
    return null;
  }
}

/**
 * Get a user by username or email
 * @param {string} usernameOrEmail - The username or email to look up
 * @returns {Object|null} The user object or null if not found
 */
export function getUserByUsernameOrEmail(usernameOrEmail) {
  try {
    const users = getUsers();
    return users.find(
      user => user.username === usernameOrEmail || user.email === usernameOrEmail
    ) || null;
  } catch (error) {
    console.error('Error getting user by username or email:', error);
    return null;
  }
}

/**
 * Get a user by ID
 * @param {string} userId - The user ID to look up
 * @returns {Object|null} The user object or null if not found
 */
export function getUserById(userId) {
  try {
    const users = getUsers();
    return users.find(user => user.id === userId) || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Authenticate a user with username/email and password
 * @param {string} usernameOrEmail - The username or email to authenticate
 * @param {string} password - The password to verify
 * @returns {Object|null} The user object if authentication succeeds, null otherwise
 */
export async function authenticateUser(usernameOrEmail, password) {
  try {
    const user = getUserByUsernameOrEmail(usernameOrEmail);
    
    if (!user) {
      return null;
    }
    
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      return null;
    }
    
    // Don't return the password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - The user object
 * @returns {string} The JWT token
 */
export function generateToken(user) {
  try {
    // Create a payload with user information
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      businessId: user.businessId
    };
    
    // Sign the token with a secret key and set expiration
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
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
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Get user and business information from a token
 * @param {string} token - The JWT token
 * @returns {Object} Object containing user and business information
 */
export function getUserAndBusinessFromToken(token) {
  try {
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return { user: null, business: null };
    }
    
    const user = getUserById(decoded.userId);
    
    if (!user) {
      return { user: null, business: null };
    }
    
    // Don't return the password hash
    const { passwordHash, ...userWithoutPassword } = user;
    
    let business = null;
    if (user.businessId) {
      business = getBusinessById(user.businessId);
    }
    
    return { user: userWithoutPassword, business };
  } catch (error) {
    console.error('Error getting user and business from token:', error);
    return { user: null, business: null };
  }
}

/**
 * Hash a password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
export async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Get users for a specific business
 * @param {string} businessId - The business ID
 * @returns {Array} Array of user objects for the business
 */
export function getUsersForBusiness(businessId) {
  try {
    const users = getUsers();
    return users.filter(user => user.businessId === businessId);
  } catch (error) {
    console.error('Error getting users for business:', error);
    return [];
  }
}

/**
 * Update a user's last login time
 * @param {string} userId - The user ID
 * @returns {boolean} True if successful, false otherwise
 */
export function updateUserLastLogin(userId) {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return false;
    }
    
    users[userIndex].lastLogin = new Date().toISOString();
    
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error updating user last login:', error);
    return false;
  }
}