"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export interface User {
  id: string
  email: string
  name: string
  plan: string
  is_verified?: boolean
  bulk_completed_email?: boolean
  weekly_digest_email?: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  reloadUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  const clearError = () => setError(null)

  // Fetch current user details on initial load
  const loadUser = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else if (res.status === 401) {
        // If expired or unauthorized, try refreshing the token
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (refreshRes.ok) {
          // Retry loading the user details
          const retryRes = await fetch(`${API_URL}/auth/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          })
          if (retryRes.ok) {
            const data = await retryRes.json()
            setUser(data)
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to load session:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || "Invalid email or password.")
      }

      setUser(data)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
      throw err;
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, plan: "free" }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create account.")
      }

      setUser(data)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
      throw err;
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (err) {
      console.error("Logout request failed:", err)
    } finally {
      setUser(null)
      setIsLoading(false)
      router.push("/")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        signup,
        logout,
        clearError,
        reloadUser: loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
