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
  purple: "gradient-purple",
  green: "gradient-green",
  orange: "gradient-orange",
  pink: "gradient-pink",
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
        "relative overflow-hidden border-0 shadow-lg content-rounded",
        hoverable && "card-hover cursor-pointer",
        className
      )}
    >
      {/* Gradient overlay */}
      <div
        className={cn("absolute inset-0 opacity-10", gradientClasses[gradient])}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Shine effect on hover */}
      {hoverable && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        </div>
      )}
    </Card>
  );
}
