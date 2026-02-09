"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Loader2,
  Clock,
  Users,
  Lock,
  Crown,
  GraduationCap,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";
import {
  useCEFRProgress,
  getProgressPercentage,
} from "@/hooks/use-cefr-progress";
import { useAuth } from "@/lib/auth";

interface Topic {
  id: string;
  order: number;
  name: string;
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
  A1: { description: "Beginner", fullName: "A1 - Beginner" },
  A2: { description: "Elementary", fullName: "A2 - Elementary" },
  B1: { description: "Intermediate", fullName: "B1 - Intermediate" },
  B2: {
    description: "Upper Intermediate",
    fullName: "B2 - Upper Intermediate",
  },
  C1: { description: "Advanced", fullName: "C1 - Advanced" },
  C2: { description: "Proficient", fullName: "C2 - Proficient" },
};

export default function LevelPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const level = (params.level as string)?.toUpperCase();
  const config = levelConfig[level] || levelConfig.A1;
  const { user } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const { data: progressData } = useCEFRProgress();

  // Check subscription status
  useEffect(() => {
    async function checkSubscription() {
      try {
        const cached = localStorage.getItem("mindote-subscription-cache");
        if (cached) {
          const { active, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setHasSubscription(active);
            return;
          }
        }
        setHasSubscription(false);
      } catch {
        setHasSubscription(false);
      }
    }
    checkSubscription();
  }, []);

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

  const getLevelProgress = () => {
    if (!progressData?.progress?.[level]) return 0;
    return progressData.progress[level].learnedCount;
  };

  const getTopicProgress = (topicId: string) => {
    if (!progressData?.progress?.[level]?.byTopic?.[topicId]) return 0;
    return progressData.progress[level].byTopic[topicId];
  };

  const isTopicLocked = (index: number) => {
    if (hasSubscription) return false;
    return index >= 2;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const learnedCount = getLevelProgress();
  const progressPercent = getProgressPercentage(learnedCount, totalWords);

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-screen transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") || "Back to CEFR"}
        </Link>

        {/* Header - Clean Study4 Style */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {config.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {topics.length} topics
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {totalWords.toLocaleString()} words
                </span>
                {progressData?.authenticated && (
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Learned: {learnedCount}/{totalWords} ({progressPercent}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Topics List - Clean Card Style */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Topics
          </h2>

          {topics.map((topic, index) => {
            const locked = isTopicLocked(index);
            const topicLearnedCount = getTopicProgress(topic.id);
            const topicProgressPercent = getProgressPercentage(
              topicLearnedCount,
              topic.wordCount,
            );

            if (locked) {
              return (
                <button
                  key={topic.id}
                  onClick={() => router.push(user ? "/billing" : "/sign-in")}
                  className="group block w-full text-left animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 opacity-60 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-500 dark:text-gray-400 truncate text-sm">
                        {topic.name}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {topic.wordCount} words
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded shrink-0">
                      <Crown className="w-3 h-3" />
                      {user ? "Premium" : "Sign in"}
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={topic.id}
                href={`/vocabulary/${level.toLowerCase()}/${topic.id}`}
                className="group block animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 25}ms` }}
              >
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all">
                  <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {topic.wordCount} words
                      {progressData?.authenticated && topicLearnedCount > 0 && (
                        <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                          • {topicProgressPercent}% learned
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {topics.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No topics found for this level.</p>
          </div>
        )}
      </div>
    </div>
  );
}
