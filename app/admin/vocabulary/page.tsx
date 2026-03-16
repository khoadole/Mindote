"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Loader2, Lock, Unlock } from "lucide-react";
import { Card } from "@/components/ui/card";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800 border-green-200",
  A2: "bg-teal-100 text-teal-800 border-teal-200",
  B1: "bg-blue-100 text-blue-800 border-blue-200",
  B2: "bg-indigo-100 text-indigo-800 border-indigo-200",
  C1: "bg-orange-100 text-orange-800 border-orange-200",
  C2: "bg-red-100 text-red-800 border-red-200",
};

const LEVEL_LABELS: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

interface LevelStat {
  level: string;
  topicCount: number;
  wordCount: number;
  freeTopicCount: number;
}

export default function AdminVocabularyPage() {
  const [stats, setStats] = useState<LevelStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/cefr")
      .then((r) => r.json())
      .then((d) => setStats(d.levels ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = stats.reduce(
    (acc, s) => ({
      topics: acc.topics + s.topicCount,
      words: acc.words + s.wordCount,
      free: acc.free + s.freeTopicCount,
    }),
    { topics: 0, words: 0, free: 0 },
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-500" />
            CEFR Vocabulary
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vocabulary topics and words across all CEFR levels
          </p>
        </div>
        {!loading && (
          <div className="flex gap-6 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{total.topics}</p>
              <p>Topics</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{total.words.toLocaleString()}</p>
              <p>Words</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{total.free}</p>
              <p>Free Topics</p>
            </div>
          </div>
        )}
      </div>

      {/* Level Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((level) => {
            const stat = stats.find((s) => s.level === level);
            const premiumCount = (stat?.topicCount ?? 0) - (stat?.freeTopicCount ?? 0);
            return (
              <Link key={level} href={`/admin/vocabulary/${level}`}>
                <Card className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-b-[3px] border-b-blue-300 dark:border-b-blue-700">
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-bold border ${LEVEL_COLORS[level]}`}
                    >
                      {level}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-3">{LEVEL_LABELS[level]}</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Topics</span>
                      <span className="font-medium text-foreground">{stat?.topicCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Words</span>
                      <span className="font-medium text-foreground">{stat?.wordCount.toLocaleString() ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="flex items-center gap-1">
                        <Unlock className="h-3 w-3 text-green-500" /> Free
                      </span>
                      <span className="font-medium text-green-600">{stat?.freeTopicCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3 text-orange-400" /> Premium
                      </span>
                      <span className="font-medium text-orange-600">{premiumCount}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
