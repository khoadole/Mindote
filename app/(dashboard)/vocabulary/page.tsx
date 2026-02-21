"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  GraduationCap,
  Clock,
  Users,
  MessageSquare,
} from "lucide-react";
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

// Clean, academic-style configuration - Study4 inspired
const levelConfig: Record<
  string,
  {
    description: string;
    fullName: string;
  }
> = {
  A1: {
    description: "Beginner",
    fullName: "A1 - Beginner",
  },
  A2: {
    description: "Elementary",
    fullName: "A2 - Elementary",
  },
  B1: {
    description: "Intermediate",
    fullName: "B1 - Intermediate",
  },
  B2: {
    description: "Upper Intermediate",
    fullName: "B2 - Upper Intermediate",
  },
  C1: {
    description: "Advanced",
    fullName: "C1 - Advanced",
  },
  C2: {
    description: "Proficient",
    fullName: "C2 - Proficient",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-screen transition-all duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-top-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2.5 text-gray-800 dark:text-white">
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            CEFR Vocabulary
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Common European Framework of Reference for Languages
          </p>
        </div>

        {/* CEFR Levels - Study4 Style Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: "50ms" }}
        >
          {levels.map((level, index) => {
            const config = levelConfig[level.level];
            const learnedCount = getLevelProgress(level.level);
            const progressPercent = getProgressPercentage(
              learnedCount,
              level.wordCount,
            );

            return (
              <Link
                key={level.level}
                href={`/vocabulary/${level.level.toLowerCase()}`}
                className="group block animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200">
                  {/* Card Content */}
                  <div className="flex-1 p-4">
                    {/* Level Title */}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-2">
                      {config.fullName}
                    </h3>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {level.topicCount} topics
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {level.wordCount.toLocaleString()} words
                      </span>
                    </div>

                    {/* Progress info - only show if authenticated */}
                    {progressData?.authenticated && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Learned: {learnedCount}/{level.wordCount} (
                          {progressPercent}%)
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        CEFR
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {config.description}
                      </span>
                    </div>
                  </div>

                  {/* Chi tiết Button */}
                  <div className="px-4 pb-4">
                    <div className="w-full py-2 text-center text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                      Chi tiết
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
