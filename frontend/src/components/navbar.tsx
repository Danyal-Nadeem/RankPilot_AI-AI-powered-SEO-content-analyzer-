"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { LogOut, User as UserIcon, LayoutDashboard, Sparkles, Search } from "lucide-react"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            R
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full dark:border-zinc-950 animate-pulse"></span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent">
            RankPilot<span className="text-indigo-500 text-base">.AI</span>
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/keywords" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Search className="w-4 h-4" />
                Keyword Research
              </Link>
            </>
          ) : (
            <>
              <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="/#demo" className="hover:text-foreground transition-colors">Interactive Demo</Link>
              <Link href="/#workflow" className="hover:text-foreground transition-colors">Workflow</Link>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* User Plan Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                {user.plan.toUpperCase()}
              </div>

              {/* Profile Brief */}
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold leading-none text-foreground">{user.name}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.email}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-9 px-3 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground rounded-lg"
              >
                <LogOut className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Log Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm font-medium hover:bg-muted rounded-lg">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
