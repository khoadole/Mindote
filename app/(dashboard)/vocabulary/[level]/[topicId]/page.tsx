"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Volume2,
  BookOpen,
  Check,
  Lock,
  Clock,
  Users,
  GraduationCap,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";
import {
  useCEFRProgress,
  useToggleWordLearned,
  getProgressPercentage,
} from "@/hooks/use-cefr-progress";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Word {
  id: string;
  order: number;
  term: string;
  pos: string;
  phonetic: string;
  definition: string;
  example: string;
}

interface TopicData {
  id: string;
  order: number;
  name: string;
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

export default function TopicWordsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const level = (params.level as string)?.toUpperCase();
  const topicId = params.topicId as string;
  const config = levelConfig[level] || levelConfig.A1;
  const { user, loading: authLoading } = useAuth();

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicIndex, setTopicIndex] = useState<number>(0);
  const [hasSubscription, setHasSubscription] = useState(false);

  const { data: progressData } = useCEFRProgress();
  const toggleWordLearned = useToggleWordLearned();

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

  // Get all learned word IDs for this level
  const learnedWordIds = new Set(
    progressData?.progress?.[level]?.wordIds || [],
  );

  // Calculate topic progress
  const learnedCount = words.filter((w) => learnedWordIds.has(w.id)).length;
  const progressPercent = getProgressPercentage(learnedCount, words.length);

  useEffect(() => {
    async function fetchWords() {
      try {
        const res = await fetch(`/api/cefr/${level?.toLowerCase()}/${topicId}`);
        const data = await res.json();
        setTopic(data.topic || null);
        setWords(data.words || []);
        setTopicIndex(data.topic?.order || 0);
      } catch (error) {
        console.error("Error fetching words:", error);
      } finally {
        setLoading(false);
      }
    }
    if (level && topicId) fetchWords();
  }, [level, topicId]);

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleToggleLearned = (wordId: string) => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const isLearned = learnedWordIds.has(wordId);
    toggleWordLearned.mutate({ wordId, learned: !isLearned });
  };

  // Check if topic is locked
  const isLocked = !hasSubscription && topicIndex >= 2;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-screen">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Topic not found.
        </p>
      </div>
    );
  }

  // Show locked state
  if (isLocked) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-screen transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href={`/vocabulary/${level.toLowerCase()}`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back") || "Back"}
          </Link>

          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 mx-auto flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t("vocabulary.topicLocked") || "Topic Locked"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm">
              {user
                ? "Upgrade to Premium to access all vocabulary topics."
                : "Sign in to access all vocabulary topics."}
            </p>
            <Button
              onClick={() => router.push(user ? "/billing" : "/sign-in")}
              size="default"
            >
              {user ? "Upgrade" : "Sign In"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-screen transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href={`/vocabulary/${level.toLowerCase()}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") || "Back"}
        </Link>

        {/* Header - Clean Study4 Style */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {level}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {config.description}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {topic.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {words.length} words
                </span>
                {progressData?.authenticated && (
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Learned: {learnedCount}/{words.length} ({progressPercent}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Login prompt for non-authenticated users */}
        {!user && !authLoading && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Sign in to track your learning progress
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/sign-in")}
                className="shrink-0"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}

        {/* Words List - Clean Card Style */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Words
          </h2>

          {words.map((word, index) => {
            const isLearned = learnedWordIds.has(word.id);

            return (
              <div
                key={word.id}
                className={cn(
                  "p-4 bg-white dark:bg-gray-900 rounded-lg border transition-all duration-200 animate-in fade-in slide-in-from-bottom-4",
                  isLearned
                    ? "border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10"
                    : "border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800",
                )}
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {word.term}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {word.pos}
                      </span>
                      {isLearned && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                          Learned
                        </span>
                      )}
                    </div>

                    {word.phonetic && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-mono mb-2">
                        {word.phonetic}
                      </p>
                    )}

                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {word.definition}
                    </p>

                    {word.example && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          "{word.example}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {/* Speak Button */}
                    <button
                      onClick={() => speak(word.term)}
                      className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Mark as Learned Button */}
                    <button
                      onClick={() => handleToggleLearned(word.id)}
                      disabled={toggleWordLearned.isPending}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        isLearned
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400",
                      )}
                      title={
                        isLearned ? "Mark as not learned" : "Mark as learned"
                      }
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {words.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No words found in this topic.</p>
          </div>
        )}
      </div>
    </div>
  );
}
