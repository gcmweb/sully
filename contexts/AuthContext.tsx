"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string, role?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    console.log('[AuthContext] Initializing auth check')
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('[AuthContext] Checking authentication status')
      setIsLoading(true)
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      })

      console.log('[AuthContext] Auth check response status:', response.status)
      console.log('[AuthContext] Auth check response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('[AuthContext] Auth check successful, user:', data.user?.email)
        
        if (data.success && data.user) {
          setUser(data.user)
          setIsAuthenticated(true)
        } else {
          console.log('[AuthContext] Auth check failed - no user data')
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        const errorData = await response.json()
        console.log('[AuthContext] Auth check failed:', errorData)
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('[AuthContext] Auth check error:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
      console.log('[AuthContext] Auth check completed')
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Starting login process for:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      console.log('[AuthContext] Login response status:', response.status)
      console.log('[AuthContext] Login response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('[AuthContext] Login response data:', data)

      if (response.ok && data.success) {
        console.log('[AuthContext] Login successful, updating state')
        setUser(data.user)
        setIsAuthenticated(true)
        
        // Redirect to dashboard
        console.log('[AuthContext] Redirecting to dashboard')
        router.push('/dashboard')
        
        return { success: true }
      } else {
        console.log('[AuthContext] Login failed:', data.error)
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error)
      return { success: false, error: 'An error occurred during login' }
    }
  }

  const register = async (email: string, password: string, name: string, role: string = 'USER') => {
    try {
      console.log('[AuthContext] Starting registration process for:', email)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role })
      })

      const data = await response.json()
      console.log('[AuthContext] Registration response:', data)

      if (response.ok && data.success) {
        console.log('[AuthContext] Registration successful, attempting login')
        // After successful registration, log the user in
        return await login(email, password)
      } else {
        console.log('[AuthContext] Registration failed:', data.error)
        return { success: false, error: data.error || 'Registration failed' }
      }
    } catch (error: any) {
      console.error('[AuthContext] Registration error:', error)
      return { success: false, error: 'An error occurred during registration' }
    }
  }

  const logout = async () => {
    try {
      console.log('[AuthContext] Starting logout process')
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      console.log('[AuthContext] Logout successful, clearing state')
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    } catch (error) {
      console.error('[AuthContext] Logout error:', error)
      // Still clear local state even if API call fails
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}