"use client";

import { Clock, BookOpen, CheckCircle2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n-provider";
import type { WritingPassage } from "@/lib/types";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  A2: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  B1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  B2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  C1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  C2: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const TOPIC_COLORS: Record<string, string> = {
  "Daily Life":             "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Food & Cooking":         "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Family & Relationships": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  "Travel":                 "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Culture & Traditions":   "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "Entertainment":          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Education":              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Work & Career":          "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  "Economics":              "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "Technology":             "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  "Science":                "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Environment":            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Health & Fitness":       "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Sports":                 "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400",
  "Society & Community":    "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400",
};

interface PassageCardProps {
  passage: WritingPassage;
  onClick: () => void;
}

export function PassageCard({ passage, onClick }: PassageCardProps) {
  const { t } = useTranslation();
  const hasAttempted = (passage._attemptCount ?? 0) > 0;

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border border-blue-200/60 dark:border-blue-800/30 border-b-[3px] border-b-blue-300 dark:border-b-blue-700 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.15)] hover:shadow-[0_4px_16px_-4px_rgba(59,130,246,0.25)] hover:-translate-y-0.5 transition-all duration-200 p-5 space-y-3"
    >
      {/* Top row: level + topic + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${LEVEL_COLORS[passage.level] ?? ""}`}
          >
            {passage.level}
          </span>
          {passage.topic && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${TOPIC_COLORS[passage.topic] ?? "bg-muted text-muted-foreground"}`}
            >
              {passage.topic}
            </span>
          )}
        </div>
        {hasAttempted && (
          <div className="flex items-center gap-1.5 shrink-0">
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
        {passage.titleEn && (
          <p className="text-xs text-muted-foreground/70 italic mt-0.5 line-clamp-1">
            {passage.titleEn}
          </p>
        )}
      </div>

      {/* Bottom metadata */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {t("writing.cardMinutes").replace("{min}", String(passage.estimatedMinutes))}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {t("writing.cardWords").replace("{count}", String(passage.targetWordCount))}
        </span>
        {hasAttempted && (
          <span className="flex items-center gap-1 ml-auto text-green-600 dark:text-green-400">
            <BookOpen className="h-3 w-3" />
            {t("writing.cardDone").replace("{count}", String(passage._attemptCount))}
          </span>
        )}
      </div>
    </Card>
  );
}
