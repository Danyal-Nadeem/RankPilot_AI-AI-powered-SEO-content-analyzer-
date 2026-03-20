import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/40 relative overflow-hidden",
        "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent after:animate-shimmer",
        className
      )}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-2 w-20" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border/20">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  )
}

export function HistoryTableSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRowSkeleton key={i} cols={5} />
      ))}
    </div>
  )
}

export function ScoreCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/30 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-2 p-4 rounded-xl border border-border/40">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuditConsoleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/30 p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-72" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-32 ml-auto rounded-lg" />
      </div>
    </div>
  )
}

export function KeywordTableSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/30 overflow-hidden">
      <div className="p-4 border-b border-border/40">
        <Skeleton className="h-5 w-48" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/20">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-48 flex-1" />
        </div>
      ))}
    </div>
  )
}
