"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WordStageCardProps {
  title: string;
  count: number;
  total: number;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  onClick?: () => void;
  description?: string;
}

export function WordStageCard({
  title,
  count,
  total,
  icon: Icon,
  gradient,
  iconColor,
  onClick,
  description,
}: WordStageCardProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-2 hover:border-primary/50 aspect-square",
        onClick && "hover:scale-105"
      )}
      onClick={onClick}
    >
      {/* Gradient Background */}
      <div
        className={cn(
          "absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity",
          gradient
        )}
      />

      <CardContent className="relative p-4 h-full flex flex-col justify-between">
        {/* Header with Icon */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "p-2 rounded-xl transition-transform group-hover:scale-110",
              iconColor
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>

        {/* Word Count */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-3xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">words</p>
          </div>
        </div>

        {/* Description - Only show on hover, keep card size */}
        <div className="h-8 overflow-hidden">
          {description && (
            <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500", gradient)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
