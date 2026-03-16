"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, GraduationCap, BookOpen, TrendingUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";
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
    color: string;
    gradient: string;
    bg: string;
    border: string;
    badge: string;
    description: string;
    fullName: string;
  }
> = {
  A1: {
    color: "green",
    gradient: "from-green-500 to-emerald-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    badge:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    description: "Beginner",
    fullName: "A1 – Beginner",
  },
  A2: {
    color: "teal",
    gradient: "from-teal-500 to-cyan-600",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    border: "border-teal-200 dark:border-teal-800",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    description: "Elementary",
    fullName: "A2 – Elementary",
  },
  B1: {
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    description: "Intermediate",
    fullName: "B1 – Intermediate",
  },
  B2: {
    color: "indigo",
    gradient: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-800",
    badge:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    description: "Upper-Interm.",
    fullName: "B2 – Upper Intermediate",
  },
  C1: {
    color: "orange",
    gradient: "from-orange-500 to-amber-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    description: "Advanced",
    fullName: "C1 – Advanced",
  },
  C2: {
    color: "red",
    gradient: "from-rose-500 to-red-600",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    description: "Proficient",
    fullName: "C2 – Proficient",
  },
};

export default function VocabularyPage() {
  const { t } = useTranslation();
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

  // Get learned count for a level
  const getLevelProgress = (level: string) => {
    if (!progressData?.progress?.[level]) return 0;
    return progressData.progress[level].learnedCount;
  };

  // Summary totals
  const totalTopics = levels.reduce((sum, l) => sum + l.topicCount, 0);
  const totalWords = levels.reduce((sum, l) => sum + l.wordCount, 0);
  const totalLearned = levels.reduce(
    (sum, l) => sum + getLevelProgress(l.level),
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1 animate-in fade-in slide-in-from-top-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            CEFR Vocabulary
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("vocabulary.pageDescription")}
          </p>
        </div>

        {/* Summary Bar */}
        {progressData?.authenticated && levels.length > 0 && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalTopics}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Topics</p>
            </div>
            <div className="text-center border-x border-gray-100 dark:border-gray-800">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalWords.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Words</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {totalLearned.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Learned</p>
            </div>
          </div>
        )}

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level, index) => {
            const cfg = LEVEL_CONFIG[level.level];
            const learnedCount = getLevelProgress(level.level);
            const progressPercent = getProgressPercentage(
              learnedCount,
              level.wordCount,
            );
            const hasStarted = learnedCount > 0;

            return (
              <Link
                key={level.level}
                href={`/vocabulary/${level.level.toLowerCase()}`}
                className="group block animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div
                  className={`h-full rounded-xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
                >
                  {/* Colored top bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

                  <div className="p-5 flex flex-col gap-4">
                    {/* Level badge + description */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xl font-black ${cfg.badge}`}
                        >
                          {level.level}
                        </span>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1.5">
                          {cfg.description}
                        </p>
                      </div>
                      {hasStarted && progressPercent === 100 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          Complete!
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {level.topicCount} topics
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {level.wordCount.toLocaleString()} words
                      </span>
                    </div>

                    {/* Progress */}
                    {progressData?.authenticated ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {learnedCount.toLocaleString()} learned
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${cfg.gradient} rounded-full transition-all duration-500`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Sign in to track progress
                      </div>
                    )}

                    {/* CTA */}
                    <div
                      className={`text-center text-sm font-medium py-2 rounded-lg border-2 ${cfg.border} text-gray-600 dark:text-gray-400 group-hover:bg-white/80 dark:group-hover:bg-gray-800/80 transition-colors`}
                    >
                      {hasStarted
                        ? progressPercent === 100
                          ? "Review →"
                          : "Continue →"
                        : "Start →"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {levels.every((l) => l.wordCount === 0) && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
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
