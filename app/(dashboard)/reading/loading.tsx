"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ✅ PERFORMANCE: Reading Page Loading Skeleton
 * Instant visual feedback while passages load
 */
export default function ReadingLoading() {
  return (
    <div className="p-4 md:p-8 bg-white dark:bg-background min-h-full animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-56 mt-1" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Reading Passages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden">
              {/* Image placeholder */}
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-3">
                {/* Title */}
                <Skeleton className="h-6 w-3/4" />
                {/* Description */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                {/* Tags */}
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                {/* Progress */}
                <Skeleton className="h-2 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
