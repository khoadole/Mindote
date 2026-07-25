"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ✅ PERFORMANCE: Dashboard Loading Skeleton
 * Shows immediately while data is fetching (Perceived Performance)
 *
 * Reference: Jakob Nielsen's response time limits:
 * - 0.1s: Feels instantaneous
 * - 1.0s: User's flow of thought stays uninterrupted
 * - 10s: User loses focus
 */
export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 bg-white dark:bg-background min-h-full animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Hero Card Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-8 md:p-10 animate-pulse">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-4 w-32 bg-blue-300/30" />
                  <Skeleton className="h-8 w-3/4 bg-blue-300/30" />
                  <Skeleton className="h-4 w-full bg-blue-300/30" />
                  <Skeleton className="h-12 w-40 rounded-xl bg-blue-300/30" />
                </div>
                <Skeleton className="w-32 h-32 rounded-2xl bg-blue-300/30" />
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Word Stages Skeleton */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50"
                    >
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </CardContent>
            </Card>

            {/* Recent Collections */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
