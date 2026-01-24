/**
 * ⚡ PERFORMANCE: Auth Loading Skeleton
 *
 * Lightweight loading state shown during client-side auth validation
 * Prevents flash of wrong content and provides instant feedback
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background overflow-hidden p-0 md:p-3 gap-0 md:gap-3">
      {/* Sidebar Skeleton */}
      <div className="hidden md:block rounded-3xl overflow-hidden shadow-sm border border-border w-64 p-4 space-y-4 animate-pulse">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 rounded-3xl bg-background shadow-sm border border-border p-6 space-y-6 animate-pulse">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/**
 * Minimal loading spinner for quick transitions
 */
export function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Đang xác thực...</p>
      </div>
    </div>
  );
}
