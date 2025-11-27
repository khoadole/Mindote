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
  
  // Extract hex color from gradient/iconColor prop
  const hexColor = gradient.match(/#[0-9A-Fa-f]{6}/)?.[0] || iconColor.match(/#[0-9A-Fa-f]{6}/)?.[0];
  
  const backgroundColor = hexColor || '#E5E5E5';

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 cursor-pointer border-0 aspect-square",
        onClick && "hover:scale-105"
      )}
      onClick={onClick}
      style={{ 
        backgroundColor,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <CardContent className="relative p-4 h-full flex flex-col justify-between">
        {/* Header with Icon */}
        <div className="flex items-center justify-between">
          <div
            className="p-2.5 rounded-full transition-transform group-hover:scale-110"
            style={{ backgroundColor: hexColor }}
          >
            <Icon className="h-6 w-6 text-gray-900" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-700">{title}</h3>

        {/* Word Count */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-4xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-600">words</p>
          </div>
        </div>

        {/* Description - Only show on hover, keep card size */}
        <div className="flex flex-col gap-0.5">
          <div className="h-8 overflow-hidden">
            {description && (
              <p className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 bg-gray-800"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
