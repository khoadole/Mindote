"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  gradientClass?: string;
  iconColor?: string;
  delay?: number;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  gradientClass = "gradient-purple",
  iconColor = "text-primary",
  delay = 0,
  trend,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate count up
  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card
      className={cn(
        "card-hover overflow-hidden border-0 shadow-lg animate-in fade-in slide-in-from-bottom-4 fill-mode-both",
        "relative"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient background overlay */}
      <div className={cn("absolute inset-0 opacity-5", gradientClass)} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary/10 to-accent/10"
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="text-3xl font-bold mb-1 text-gradient-purple">
          {displayValue.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>

        {trend && (
          <div className="flex items-center gap-1 text-xs">
            <span
              className={cn(
                "font-medium",
                trend.isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-orange-600 dark:text-orange-400"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
