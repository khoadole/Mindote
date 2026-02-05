"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Loader2, 
  GraduationCap,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";
import { useCEFRProgress, getProgressPercentage } from "@/hooks/use-cefr-progress";
import { Progress } from "@/components/ui/progress";

interface CEFRLevel {
  level: string;
  topicCount: number;
  wordCount: number;
}

const levelConfig: Record<string, { 
  color: string; 
  bgColor: string;
  borderColor: string;
  description: string;
  emoji: string;
}> = {
  A1: { 
    color: "text-emerald-600 dark:text-emerald-400", 
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600",
    description: "Beginner",
    emoji: "🌱"
  },
  A2: { 
    color: "text-teal-600 dark:text-teal-400", 
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800/50 hover:border-teal-400 dark:hover:border-teal-600",
    description: "Elementary",
    emoji: "🌿"
  },
  B1: { 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600",
    description: "Intermediate",
    emoji: "📚"
  },
  B2: { 
    color: "text-violet-600 dark:text-violet-400", 
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800/50 hover:border-violet-400 dark:hover:border-violet-600",
    description: "Upper Intermediate",
    emoji: "🎯"
  },
  C1: { 
    color: "text-orange-600 dark:text-orange-400", 
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800/50 hover:border-orange-400 dark:hover:border-orange-600",
    description: "Advanced",
    emoji: "⭐"
  },
  C2: { 
    color: "text-rose-600 dark:text-rose-400", 
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800/50 hover:border-rose-400 dark:hover:border-rose-600",
    description: "Proficient",
    emoji: "👑"
  },
};

export default function VocabularyPage() {
  const { t } = useTranslation();
  const [levels, setLevels] = useState<CEFRLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: progressData, isLoading: progressLoading } = useCEFRProgress();

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

  const totalWords = levels.reduce((sum, level) => sum + level.wordCount, 0);
  
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
    <div className="p-4 md:p-8 bg-white dark:bg-background min-h-screen transition-all duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-top-4">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
            <GraduationCap className="w-8 h-8 text-primary" />
            CEFR
          </h1>
        </div>

        {/* CEFR Levels - Horizontal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "50ms" }}>
          {levels.map((level, index) => {
            const config = levelConfig[level.level];
            const learnedCount = getLevelProgress(level.level);
            const progressPercent = getProgressPercentage(learnedCount, level.wordCount);
            
            return (
              <Link
                key={level.level}
                href={`/vocabulary/${level.level.toLowerCase()}`}
                className="group block animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${config.bgColor} ${config.borderColor}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Emoji & Level */}
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{config.emoji}</span>
                      <div>
                        <h3 className={`text-2xl font-bold ${config.color}`}>{level.level}</h3>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-12 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

                    {/* Stats */}
                    <div className="flex-1 text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{level.wordCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t("dashboard.words") || "words"}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {progressData?.authenticated && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {t("vocabulary.learned") || "Learned"}
                        </span>
                        <span className={`font-medium ${config.color}`}>
                          {learnedCount}/{level.wordCount} ({progressPercent}%)
                        </span>
                      </div>
                      <Progress 
                        value={progressPercent} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {levels.every((l) => l.wordCount === 0) && (
          <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-amber-600 dark:text-amber-400">
              ⚠️ No vocabulary data found. Please run the import script to populate the database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
