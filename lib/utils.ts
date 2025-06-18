import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get cookie configuration based on environment
 */
export function getCookieConfig() {
  const isProduction = process.env.NODE_ENV === 'production'
  const isPreview = process.env.VERCEL_ENV === 'preview' || 
                   typeof window !== 'undefined' && window.location.hostname.includes('preview')
  
  console.log('[Utils] Cookie config - isProduction:', isProduction, 'isPreview:', isPreview)
  
  return {
    httpOnly: true,
    secure: isProduction || isPreview, // Use secure cookies in production and preview
    sameSite: (isProduction || isPreview) ? 'none' as const : 'lax' as const, // Allow cross-site for preview domains
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    domain: undefined // Let the browser handle domain automatically
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}