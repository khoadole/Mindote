"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Volume2, BookOpen, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";

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

const levelConfig: Record<string, { 
  color: string; 
  bgColor: string;
  borderColor: string;
  iconBg: string;
  cardBorder: string;
}> = {
  A1: { 
    color: "text-emerald-600 dark:text-emerald-400", 
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    iconBg: "bg-emerald-500",
    cardBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
  A2: { 
    color: "text-teal-600 dark:text-teal-400", 
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800/50",
    iconBg: "bg-teal-500",
    cardBorder: "hover:border-teal-300 dark:hover:border-teal-700",
  },
  B1: { 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800/50",
    iconBg: "bg-blue-500",
    cardBorder: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  B2: { 
    color: "text-violet-600 dark:text-violet-400", 
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800/50",
    iconBg: "bg-violet-500",
    cardBorder: "hover:border-violet-300 dark:hover:border-violet-700",
  },
  C1: { 
    color: "text-orange-600 dark:text-orange-400", 
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800/50",
    iconBg: "bg-orange-500",
    cardBorder: "hover:border-orange-300 dark:hover:border-orange-700",
  },
  C2: { 
    color: "text-rose-600 dark:text-rose-400", 
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800/50",
    iconBg: "bg-rose-500",
    cardBorder: "hover:border-rose-300 dark:hover:border-rose-700",
  },
};

export default function TopicWordsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const level = (params.level as string)?.toUpperCase();
  const topicId = params.topicId as string;
  const config = levelConfig[level] || levelConfig.A1;

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-4 md:p-8 bg-white dark:bg-background min-h-screen">
        <p className="text-center text-muted-foreground">Topic not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-white dark:bg-background min-h-screen transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href={`/vocabulary/${level.toLowerCase()}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors animate-in fade-in slide-in-from-left-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") || "Back"}
        </Link>

        {/* Header */}
        <div className={`p-6 rounded-2xl border-2 ${config.bgColor} ${config.borderColor} animate-in fade-in slide-in-from-top-4`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${config.iconBg} text-white`}>
              {level}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              {words.length} {t("dashboard.words") || "words"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{topic.name}</h1>
        </div>

        {/* Words List */}
        <div className="space-y-4">
          {words.map((word, index) => (
            <div
              key={word.id}
              className={`p-5 rounded-2xl bg-card border-2 border-gray-100 dark:border-gray-800 ${config.cardBorder} transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`text-xl font-bold ${config.color}`}>{word.term}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg font-medium">
                      {word.pos}
                    </span>
                  </div>

                  {word.phonetic && (
                    <p className="text-muted-foreground text-sm mt-1 font-mono">
                      {word.phonetic}
                    </p>
                  )}

                  <p className="mt-3 text-gray-700 dark:text-gray-300">{word.definition}</p>

                  {word.example && (
                    <div className={`mt-3 p-3 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
                      <p className="text-sm text-muted-foreground italic">
                        "{word.example}"
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => speak(word.term)}
                  className={`flex-shrink-0 p-3 rounded-xl ${config.iconBg} text-white hover:opacity-90 transition-all hover:scale-105 shadow-md`}
                  title="Listen to pronunciation"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {words.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No words found in this topic.</p>
          </div>
        )}
      </div>
    </div>
  );
}
