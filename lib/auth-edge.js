// Edge Runtime compatible auth functions
// This file only contains functions that can run in Edge Runtime (no Node.js APIs)

const JWT_SECRET = process.env.JWT_SECRET || 'sully-booking-system-secret-key-development';

/**
 * Simple JWT verification for Edge Runtime
 * Uses Web Crypto API instead of jsonwebtoken library
 * @param {string} token - The JWT token to verify
 * @returns {Promise<Object|null>} The decoded token payload if valid, null otherwise
 */
export async function verifyTokenEdge(token) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode header and payload
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // For Edge Runtime, we'll do a basic signature verification
    // In production, you might want to use Web Crypto API for proper verification
    const encoder = new TextEncoder();
    const data = encoder.encode(parts[0] + '.' + parts[1]);
    const key = encoder.encode(JWT_SECRET);
    
    // Use Web Crypto API to verify signature
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Decode the signature
    const signature = new Uint8Array(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    const isValid = await crypto.subtle.verify('HMAC', cryptoKey, signature, data);
    
    if (!isValid) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('[Auth Edge] Error verifying token:', error);
    return null;
  }
}

/**
 * Fallback token verification that just checks basic structure and expiration
 * Use this if Web Crypto API verification fails
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} The decoded token payload if valid, null otherwise
 */
export function verifyTokenBasic(token) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Basic validation - check required fields
    if (!payload.userId || !payload.email) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[Auth Edge] Error in basic token verification:', error);
    return null;
  }
}
