"use client";

import { Clock, BookOpen, CheckCircle2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WritingPassage } from "@/lib/types";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  A2: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  B1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  B2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  C1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  C2: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface PassageCardProps {
  passage: WritingPassage;
  onClick: () => void;
}

export function PassageCard({ passage, onClick }: PassageCardProps) {
  const hasAttempted = (passage._attemptCount ?? 0) > 0;

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border border-blue-200/60 dark:border-blue-800/30 border-b-[3px] border-b-blue-300 dark:border-b-blue-700 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.15)] hover:shadow-[0_4px_16px_-4px_rgba(59,130,246,0.25)] hover:-translate-y-0.5 transition-all duration-200 p-5 space-y-3"
    >
      {/* Top row: level + status */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${LEVEL_COLORS[passage.level] ?? ""}`}
        >
          {passage.level}
        </span>
        {hasAttempted && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            {passage._lastScore !== null && passage._lastScore !== undefined && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {passage._lastScore.toFixed(1)}/10
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">
          {passage.title}
        </h3>
        {passage.topic && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {passage.topic}
          </p>
        )}
      </div>

      {/* Bottom metadata */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {passage.estimatedMinutes}m
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          ~{passage.targetWordCount} words
        </span>
        {hasAttempted && (
          <span className="flex items-center gap-1 ml-auto text-green-600 dark:text-green-400">
            <BookOpen className="h-3 w-3" />
            {passage._attemptCount}× done
          </span>
        )}
      </div>
    </Card>
  );
}
