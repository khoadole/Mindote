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
  Sparkles,
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
  isFree: boolean;
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
  }
> = {
  A1: {
    gradient: "from-green-500 to-emerald-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-500 text-white",
    text: "text-green-700 dark:text-green-400",
    description: "Beginner",
  },
  A2: {
    gradient: "from-teal-500 to-cyan-600",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    border: "border-teal-200 dark:border-teal-800",
    badge: "bg-teal-500 text-white",
    text: "text-teal-700 dark:text-teal-400",
    description: "Elementary",
  },
  B1: {
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-600 text-white",
    text: "text-blue-700 dark:text-blue-400",
    description: "Intermediate",
  },
  B2: {
    gradient: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-800",
    badge: "bg-indigo-600 text-white",
    text: "text-indigo-700 dark:text-indigo-400",
    description: "Upper Interm.",
  },
  C1: {
    gradient: "from-orange-500 to-amber-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-500 text-white",
    text: "text-orange-700 dark:text-orange-400",
    description: "Advanced",
  },
  C2: {
    gradient: "from-rose-500 to-red-600",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-600 text-white",
    text: "text-rose-700 dark:text-rose-400",
    description: "Proficient",
  },
};

const POS_COLORS: Record<string, string> = {
  noun: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  verb: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  adjective: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  adverb: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  preposition: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  conjunction: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  pronoun: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  determiner: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  interjection: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  article: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  numeral: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  exclamation: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  phrase: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  abbreviation: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

type FilterTab = "all" | "learning" | "learned";

export default function TopicWordsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const level = (params.level as string)?.toUpperCase();
  const topicId = params.topicId as string;
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.A1;
  const { user, loading: authLoading } = useAuth();

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

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
  const allLearned = words.length > 0 && learnedCount === words.length;

  useEffect(() => {
    async function fetchWords() {
      try {
        const res = await fetch(`/api/cefr/${level?.toLowerCase()}/${topicId}`);
        const data = await res.json();
        setTopic(data.topic || null);
        setWords(data.words || []);
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
  const isLocked = !hasSubscription && !(topic?.isFree ?? true);

  const filteredWords = words.filter((word) => {
    if (activeTab === "learned") return learnedWordIds.has(word.id);
    if (activeTab === "learning") return !learnedWordIds.has(word.id);
    return true;
  });

  const learnedTabCount = words.filter((w) => learnedWordIds.has(w.id)).length;
  const learningTabCount = words.length - learnedTabCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-full">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Topic not found.
        </p>
      </div>
    );
  }

  // Show locked state
  if (isLocked) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-full">
        <div className="max-w-3xl mx-auto space-y-6">
          <Link
            href={`/vocabulary/${level.toLowerCase()}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            <Button onClick={() => router.push(user ? "/billing" : "/sign-in")}>
              {user ? "Upgrade" : "Sign In"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-background min-h-full">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Back Link */}
        <Link
          href={`/vocabulary/${level.toLowerCase()}`}
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/70 text-xs font-medium uppercase tracking-wide">
                    {level} · {cfg.description}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white">{topic.name}</h1>
                <p className="text-white/80 text-sm mt-0.5">
                  {words.length} words
                </p>
              </div>
            </div>
          </div>

          {/* Progress strip (authenticated users only) */}
          {progressData?.authenticated && (
            <div className={`${cfg.bg} px-6 py-3 border-t ${cfg.border}`}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className={`font-semibold ${cfg.text}`}>
                  {learnedCount} / {words.length} ({progressPercent}%)
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

        {/* Celebration banner */}
        {allLearned && progressData?.authenticated && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl animate-in fade-in zoom-in-95">
            <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                All words learned!
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Great job mastering this topic. Keep it up!
              </p>
            </div>
          </div>
        )}

        {/* Login prompt for non-authenticated users */}
        {!user && !authLoading && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
            <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
              Sign in to track your learning progress
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/sign-in")}
              className="shrink-0"
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Filter tabs (authenticated only) */}
        {progressData?.authenticated && (
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
            {(
              [
                { key: "all", label: `All (${words.length})` },
                { key: "learning", label: `To Learn (${learningTabCount})` },
                { key: "learned", label: `Learned (${learnedTabCount})` },
              ] as { key: FilterTab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeTab === key
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Words List */}
        <div className="space-y-3">
          {filteredWords.map((word, index) => {
            const isLearned = learnedWordIds.has(word.id);
            const posColor =
              POS_COLORS[word.pos?.toLowerCase()] ?? POS_COLORS.other;

            return (
              <div
                key={word.id}
                className={cn(
                  "relative rounded-xl border-2 bg-white dark:bg-gray-900 transition-all duration-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4",
                  isLearned
                    ? "border-green-200 dark:border-green-800/60"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm",
                )}
                style={{ animationDelay: `${index * 20}ms` }}
              >
                {/* Green left accent strip */}
                {isLearned && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 dark:bg-green-600 rounded-l-xl" />
                )}

                <div className="p-4 pl-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Term + POS + learned badge */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {word.term}
                        </h3>
                        {word.pos && (
                          <span
                            className={cn(
                              "text-[11px] font-medium px-1.5 py-0.5 rounded",
                              posColor,
                            )}
                          >
                            {word.pos}
                          </span>
                        )}
                        {isLearned && (
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            Learned
                          </span>
                        )}
                      </div>

                      {/* Phonetic */}
                      {word.phonetic && (
                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mb-2">
                          {word.phonetic}
                        </p>
                      )}

                      {/* Definition */}
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {word.definition}
                      </p>

                      {/* Example */}
                      {word.example && (
                        <div className="mt-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            "{word.example}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => speak(word.term)}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Listen to pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleLearned(word.id)}
                        disabled={toggleWordLearned.isPending}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isLearned
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400",
                        )}
                        title={isLearned ? "Mark as not learned" : "Mark as learned"}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state for filtered tab */}
        {filteredWords.length === 0 && words.length > 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">
              {activeTab === "learning"
                ? "No words left to learn in this topic!"
                : "No learned words yet. Start marking words as learned!"}
            </p>
          </div>
        )}

        {/* Empty state for no words at all */}
        {words.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No words found in this topic.</p>
          </div>
        )}
      </div>
    </div>
  );
}
