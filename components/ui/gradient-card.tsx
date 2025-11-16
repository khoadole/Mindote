"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GradientCardProps {
  children: ReactNode;
  gradient?: "purple" | "green" | "orange" | "pink";
  className?: string;
  hoverable?: boolean;
}

const gradientClasses = {
  purple: "gradient-purple-vibrant",
  green: "gradient-green-vibrant",
  orange: "gradient-orange-vibrant",
  pink: "gradient-pink-vibrant",
};

export function GradientCard({
  children,
  gradient = "purple",
  className,
  hoverable = true,
}: GradientCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 content-rounded card-floating",
        hoverable && "card-hover cursor-pointer",
        className
      )}
    >
      {/* Vibrant gradient background for light mode, subtle for dark mode */}
      <div
        className={cn(
          "absolute inset-0 dark:opacity-20",
          gradientClasses[gradient]
        )}
      />

      {/* Subtle dotted pattern overlay (light mode only) */}
      <div className="absolute inset-0 opacity-[0.08] dark:opacity-0 pointer-events-none pattern-dots" />

      {/* Content with white text in light mode */}
      <div className="relative z-10 text-white dark:text-card-foreground">
        {children}
      </div>

      {/* Enhanced shine effect on hover */}
      {hoverable && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
        </div>
      )}
    </Card>
  );
}
