"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ✅ PERFORMANCE: Quiz Page Loading Skeleton
 * Instant visual feedback while quiz data loads
 */
export default function QuizLoading() {
  return (
    <div className="p-4 md:p-8 bg-white dark:bg-background min-h-screen animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>

        {/* Settings Card */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Collection Selector */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            {/* Quiz Type */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <div className="flex justify-center">
          <Skeleton className="h-14 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
