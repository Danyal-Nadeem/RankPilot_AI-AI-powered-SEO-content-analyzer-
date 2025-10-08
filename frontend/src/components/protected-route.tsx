"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Verifying secure session...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Return nothing while redirecting to keep layout clean
  }

  return <>{children}</>
}
