"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, Loader2, Target, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";

interface Topic {
  id: string;
  order: number;
  name: string;
  wordCount: number;
}

const levelConfig: Record<string, { 
  color: string; 
  bgColor: string;
  borderColor: string;
  iconBg: string;
  description: string;
  emoji: string;
}> = {
  A1: { 
    color: "text-emerald-600 dark:text-emerald-400", 
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    iconBg: "bg-emerald-500",
    description: "Beginner",
    emoji: "🌱"
  },
  A2: { 
    color: "text-teal-600 dark:text-teal-400", 
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800/50",
    iconBg: "bg-teal-500",
    description: "Elementary",
    emoji: "🌿"
  },
  B1: { 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800/50",
    iconBg: "bg-blue-500",
    description: "Intermediate",
    emoji: "📚"
  },
  B2: { 
    color: "text-violet-600 dark:text-violet-400", 
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800/50",
    iconBg: "bg-violet-500",
    description: "Upper Intermediate",
    emoji: "🎯"
  },
  C1: { 
    color: "text-orange-600 dark:text-orange-400", 
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800/50",
    iconBg: "bg-orange-500",
    description: "Advanced",
    emoji: "⭐"
  },
  C2: { 
    color: "text-rose-600 dark:text-rose-400", 
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800/50",
    iconBg: "bg-rose-500",
    description: "Proficient",
    emoji: "👑"
  },
};

export default function LevelPage() {
  const { t } = useTranslation();
  const params = useParams();
  const level = (params.level as string)?.toUpperCase();
  const config = levelConfig[level] || levelConfig.A1;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch(`/api/cefr/${level?.toLowerCase()}`);
        const data = await res.json();
        setTopics(data.topics || []);
      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(false);
      }
    }
    if (level) fetchTopics();
  }, [level]);

  const totalWords = topics.reduce((sum, t) => sum + t.wordCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-white dark:bg-background min-h-screen transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors animate-in fade-in slide-in-from-left-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") || "Back"}
        </Link>

        {/* Header */}
        <div className={`flex items-center gap-4 p-6 rounded-2xl border-2 ${config.bgColor} ${config.borderColor} animate-in fade-in slide-in-from-top-4`}>
          <span className="text-5xl">{config.emoji}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className={`text-4xl font-bold ${config.color}`}>{level}</h1>
              <span className="text-lg text-muted-foreground">• {config.description}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {topics.length} topics
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {totalWords.toLocaleString()} {t("dashboard.words") || "words"}
              </span>
            </div>
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <Link
              key={topic.id}
              href={`/vocabulary/${level.toLowerCase()}/${topic.id}`}
              className="group block animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-md hover:scale-[1.01] bg-card hover:${config.bgColor} border-gray-100 dark:border-gray-800 hover:${config.borderColor}`}>
                {/* Order Number */}
                <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {index + 1}
                </div>

                {/* Topic Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {topic.wordCount} {t("dashboard.words") || "words"}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {topics.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No topics found for this level.</p>
          </div>
        )}
      </div>
    </div>
  );
}
