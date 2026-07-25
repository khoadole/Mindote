"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, GraduationCap } from "lucide-react";
import {
  useCEFRProgress,
  getProgressPercentage,
} from "@/hooks/use-cefr-progress";

interface CEFRLevel {
  level: string;
  topicCount: number;
  wordCount: number;
}

const LEVEL_CONFIG: Record<
  string,
  {
    accentColor: string;
    iconBg: string;
    iconText: string;
    description: string;
    fullName: string;
  }
> = {
  A1: {
    accentColor: "#14b8a6",
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    iconText: "text-teal-700 dark:text-teal-300",
    description: "Beginner",
    fullName: "A1 – Beginner",
  },
  A2: {
    accentColor: "#06b6d4",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
    iconText: "text-cyan-700 dark:text-cyan-300",
    description: "Elementary",
    fullName: "A2 – Elementary",
  },
  B1: {
    accentColor: "#3b82f6",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconText: "text-blue-700 dark:text-blue-300",
    description: "Intermediate",
    fullName: "B1 – Intermediate",
  },
  B2: {
    accentColor: "#8b5cf6",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconText: "text-violet-700 dark:text-violet-300",
    description: "Upper-Intermediate",
    fullName: "B2 – Upper Intermediate",
  },
  C1: {
    accentColor: "#f97316",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    iconText: "text-orange-700 dark:text-orange-300",
    description: "Advanced",
    fullName: "C1 – Advanced",
  },
  C2: {
    accentColor: "#f43f5e",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconText: "text-rose-700 dark:text-rose-300",
    description: "Proficient",
    fullName: "C2 – Proficient",
  },
};

export default function VocabularyPage() {
  const [levels, setLevels] = useState<CEFRLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: progressData } = useCEFRProgress();

  useEffect(() => {
    async function fetchLevels() {
      try {
        const res = await fetch("/api/cefr");
        const data = await res.json();
        setLevels(data.levels || []);
      } catch (error) {
        console.error("Error fetching levels:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLevels();
  }, []);

  const getLevelProgress = (level: string) => {
    if (!progressData?.progress?.[level]) return 0;
    return progressData.progress[level].learnedCount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full bg-stone-50 dark:bg-background">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-stone-400 dark:text-muted-foreground flex-shrink-0" />
          <h1 className="text-3xl font-black text-stone-900 dark:text-foreground tracking-tight">
            CEFR Vocabulary
          </h1>
        </div>

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => {
            const cfg = LEVEL_CONFIG[level.level];
            const learnedCount = getLevelProgress(level.level);
            const progressPercent = getProgressPercentage(learnedCount, level.wordCount);
            const hasStarted = learnedCount > 0;
            const isDone = hasStarted && progressPercent === 100;

            return (
              <Link
                key={level.level}
                href={`/vocabulary/${level.level.toLowerCase()}`}
                className="group block"
              >
                <div
                  className="micro-card h-full bg-white dark:bg-card rounded-2xl border border-stone-200 dark:border-border overflow-hidden transition-colors duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] flex"
                  style={{ borderLeft: `3px solid ${cfg.accentColor}` }}
                >
                  <div className="p-5 flex flex-col gap-4 flex-1">

                    {/* Level identity */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-sm font-black ${cfg.iconText}`}>
                            {level.level}
                          </span>
                        </div>
                        <div>
                          <div className="text-base font-black text-stone-900 dark:text-foreground leading-tight">
                            {cfg.description}
                          </div>
                          <div className="text-[11px] text-stone-400 dark:text-muted-foreground mt-0.5">
                            {cfg.fullName}
                          </div>
                        </div>
                      </div>

                      {isDone && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                          ✓ Done
                        </span>
                      )}
                    </div>

                    {/* Progress section */}
                    {progressData?.authenticated ? (
                      <div className="space-y-2 mt-auto">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-stone-400 dark:text-muted-foreground">
                            {hasStarted ? "Progress" : "Not started"}
                          </span>
                          <span className="text-sm font-black text-stone-800 dark:text-foreground">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-stone-100 dark:bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400 dark:text-muted-foreground mt-auto">
                        Sign in to track progress
                      </div>
                    )}

                    {/* CTA */}
                    <div
                      className="micro-press text-center text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      style={{
                        backgroundColor: isDone
                          ? "transparent"
                          : `${cfg.accentColor}12`,
                        color: cfg.accentColor,
                        border: `1.5px solid ${cfg.accentColor}30`,
                      }}
                    >
                      {isDone ? "Review →" : hasStarted ? "Continue →" : "Start →"}
                    </div>

                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {levels.every((l) => l.wordCount === 0) && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              No vocabulary data found. Please run the import script to populate
              the database.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
