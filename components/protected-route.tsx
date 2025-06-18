"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'USER' | 'ADMIN'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    console.log('[ProtectedRoute] Auth state:', { 
      isLoading, 
      isAuthenticated, 
      user: user?.email,
      requiredRole 
    })

    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('[ProtectedRoute] User not authenticated, redirecting to login')
        setIsRedirecting(true)
        router.push('/login')
        return
      }

      if (requiredRole && user?.role !== requiredRole) {
        console.log('[ProtectedRoute] User does not have required role, redirecting')
        setIsRedirecting(true)
        router.push('/dashboard')
        return
      }

      console.log('[ProtectedRoute] User authorized, rendering content')
      setIsRedirecting(false)
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router])

  if (isLoading) {
    console.log('[ProtectedRoute] Auth loading, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || isRedirecting) {
    console.log('[ProtectedRoute] Not authenticated or redirecting, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log('[ProtectedRoute] Insufficient role, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  console.log('[ProtectedRoute] Rendering protected content')
  return <>{children}</>
}