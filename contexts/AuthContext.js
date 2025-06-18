"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated on mount
  useEffect(() => {
    console.log("[AuthContext] Initializing auth check");
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("[AuthContext] Checking authentication status");
      setIsLoading(true);
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      console.log("[AuthContext] Auth check response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[AuthContext] Auth check successful, user:", data.user);
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        console.log("[AuthContext] Auth check failed, clearing user state");
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log("[AuthContext] Auth check completed");
    }
  };

  const login = async (email, password) => {
    try {
      console.log("[AuthContext] Starting login process for:", email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      console.log("[AuthContext] Login response status:", response.status);
      const data = await response.json();
      console.log("[AuthContext] Login response data:", data);

      if (response.ok && data.success) {
        console.log("[AuthContext] Login successful, updating state");
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Use replace instead of push to avoid back button issues
        console.log("[AuthContext] Redirecting to dashboard");
        router.replace('/dashboard');
        
        return { success: true };
      } else {
        console.log("[AuthContext] Login failed:", data.error);
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const register = async (email, password, name, role = 'STAFF') => {
    try {
      console.log("[AuthContext] Starting registration process for:", email);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await response.json();
      console.log("[AuthContext] Registration response:", data);

      if (response.ok) {
        console.log("[AuthContext] Registration successful, attempting login");
        // After successful registration, log the user in
        return await login(email, password);
      } else {
        console.log("[AuthContext] Registration failed:", data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('[AuthContext] Registration failed:', error);
      return { success: false, error: 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthContext] Starting logout process");
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      console.log("[AuthContext] Logout successful, clearing state");
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/login');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/login');
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}