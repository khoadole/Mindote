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
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2 hover:border-primary/50",
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

      <CardContent className="relative p-4 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg transition-transform group-hover:scale-110",
                iconColor
              )}
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground font-semibold">
              {percentage}%
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-muted-foreground">
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-bold">{count}</p>
            <p className="text-base text-muted-foreground">words</p>
          </div>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500", gradient)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
