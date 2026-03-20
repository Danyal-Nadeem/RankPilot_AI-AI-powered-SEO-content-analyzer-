"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  componentName?: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.componentName ? `:${this.props.componentName}` : ""}]`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center space-y-4 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
              {this.props.componentName ? `${this.props.componentName} failed to load` : "Something went wrong"}
            </h3>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-xs mx-auto">
              {this.state.error?.message || "Unexpected render error"}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
