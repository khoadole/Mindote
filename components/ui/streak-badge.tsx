"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  days: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function StreakBadge({
  days,
  className,
  size = "md",
}: StreakBadgeProps) {
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl font-semibold",
        "bg-gradient-to-r from-orange-500 to-pink-500",
        "text-white shadow-lg shadow-orange-500/30",
        "animate-pulse-glow",
        sizeClasses[size],
        className
      )}
    >
      <Flame className={cn("animate-pulse", iconSizes[size])} />
      <span>
        {days} day{days !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
