"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Loader2,
  Lock,
  Crown,
  CheckCircle2,
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
  isFree: boolean;
  wordCount: number;
}

const LEVEL_CONFIG: Record<
  string,
  {
    gradient: string;
    bg: string;
    border: string;
    badge: string;
    text: string;
    description: string;
    fullName: string;
  }
> = {
  A1: {
    gradient: "from-green-500 to-emerald-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-500 text-white",
    text: "text-green-700 dark:text-green-400",
    description: "Beginner",
    fullName: "A1 – Beginner",
  },
  A2: {
    gradient: "from-teal-500 to-cyan-600",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    border: "border-teal-200 dark:border-teal-800",
    badge: "bg-teal-500 text-white",
    text: "text-teal-700 dark:text-teal-400",
    description: "Elementary",
    fullName: "A2 – Elementary",
  },
  B1: {
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-600 text-white",
    text: "text-blue-700 dark:text-blue-400",
    description: "Intermediate",
    fullName: "B1 – Intermediate",
  },
  B2: {
    gradient: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-800",
    badge: "bg-indigo-600 text-white",
    text: "text-indigo-700 dark:text-indigo-400",
    description: "Upper Interm.",
    fullName: "B2 – Upper Intermediate",
  },
  C1: {
    gradient: "from-orange-500 to-amber-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-500 text-white",
    text: "text-orange-700 dark:text-orange-400",
    description: "Advanced",
    fullName: "C1 – Advanced",
  },
  C2: {
    gradient: "from-rose-500 to-red-600",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-600 text-white",
    text: "text-rose-700 dark:text-rose-400",
    description: "Proficient",
    fullName: "C2 – Proficient",
  },
};

export default function LevelPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const level = (params.level as string)?.toUpperCase();
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.A1;
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

  const isTopicLocked = (topic: Topic) => {
    if (hasSubscription) return false;
    return !topic.isFree;
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
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") || "Back"}
        </Link>

        {/* Header Card */}
        <div
          className={`rounded-xl border-2 ${cfg.border} overflow-hidden animate-in fade-in slide-in-from-top-4`}
        >
          {/* Gradient Banner */}
          <div className={`bg-gradient-to-r ${cfg.gradient} px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white/80 text-sm font-medium">
                  CEFR Level
                </span>
                <h1 className="text-3xl font-black text-white">
                  {cfg.fullName}
                </h1>
                <p className="text-white/80 text-sm mt-0.5">
                  {cfg.description}
                </p>
              </div>
              <div className="text-right text-white/80 text-sm space-y-0.5">
                <p>
                  <span className="text-white font-bold text-lg">
                    {topics.length}
                  </span>{" "}
                  topics
                </p>
                <p>
                  <span className="text-white font-bold text-lg">
                    {totalWords.toLocaleString()}
                  </span>{" "}
                  words
                </p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {progressData?.authenticated && (
            <div
              className={`${cfg.bg} px-6 py-3 border-t ${cfg.border}`}
            >
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className={`font-semibold ${cfg.text}`}>
                  {learnedCount.toLocaleString()} /{" "}
                  {totalWords.toLocaleString()} words ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${cfg.gradient} rounded-full transition-all duration-700`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Topics List */}
        <div
          className="space-y-2 animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
            Topics
          </p>

          {topics.map((topic, index) => {
            const locked = isTopicLocked(topic);
            const topicLearned = getTopicProgress(topic.id);
            const topicPercent = getProgressPercentage(
              topicLearned,
              topic.wordCount,
            );
            const isComplete =
              progressData?.authenticated &&
              topic.wordCount > 0 &&
              topicPercent === 100;

            const topicCard = (
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                  locked
                    ? "border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 opacity-60"
                    : isComplete
                      ? "border-green-200 dark:border-green-800/60 bg-green-50/50 dark:bg-green-900/10 hover:shadow-sm"
                      : `border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm`
                }`}
              >
                {/* Number / Status Badge */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${
                    locked
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400"
                      : isComplete
                        ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                        : `${cfg.badge} opacity-90`
                  }`}
                >
                  {locked ? (
                    <Lock className="w-4 h-4" />
                  ) : isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-medium text-sm truncate ${
                        locked
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {topic.name}
                    </h3>
                    {locked && (
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-0.5">
                        <Crown className="w-3 h-3" />
                        {user ? "Premium" : "Sign in"}
                      </span>
                    )}
                  </div>

                  {/* Per-topic progress bar */}
                  {!locked && progressData?.authenticated && (
                    <div className="mt-1.5">
                      <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${cfg.gradient} rounded-full transition-all duration-500`}
                          style={{ width: `${topicPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side */}
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">
                    {topic.wordCount} words
                  </p>
                  {!locked &&
                    progressData?.authenticated &&
                    topicLearned > 0 && (
                      <p
                        className={`text-xs font-medium mt-0.5 ${
                          isComplete
                            ? "text-green-600 dark:text-green-400"
                            : cfg.text
                        }`}
                      >
                        {topicLearned}/{topic.wordCount}
                      </p>
                    )}
                </div>

                {!locked && (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                )}
              </div>
            );

            if (locked) {
              return (
                <button
                  key={topic.id}
                  onClick={() =>
                    router.push(user ? "/billing" : "/sign-in")
                  }
                  className="group w-full text-left animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {topicCard}
                </button>
              );
            }

            return (
              <Link
                key={topic.id}
                href={`/vocabulary/${level.toLowerCase()}/${topic.id}`}
                className="group block animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {topicCard}
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
