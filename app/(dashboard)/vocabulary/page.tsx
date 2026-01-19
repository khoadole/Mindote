"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";

interface CEFRLevel {
  level: string;
  topicCount: number;
  wordCount: number;
}

const levelColors: Record<string, string> = {
  A1: "from-green-500 to-emerald-600",
  A2: "from-teal-500 to-cyan-600",
  B1: "from-blue-500 to-indigo-600",
  B2: "from-purple-500 to-violet-600",
  C1: "from-orange-500 to-red-600",
  C2: "from-rose-500 to-pink-600",
};

const levelDescriptions: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

export default function VocabularyPage() {
  const [levels, setLevels] = useState<CEFRLevel[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          CEFR Vocabulary
        </h1>
        <p className="text-muted-foreground mt-2">
          Learn vocabulary organized by CEFR levels from A1 (Beginner) to C2
          (Proficient)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level) => (
          <Link
            key={level.level}
            href={`/vocabulary/${level.level.toLowerCase()}`}
            className="group block"
          >
            <div
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${levelColors[level.level]} p-6 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -right-8 top-8 h-16 w-16 rounded-full bg-white/5" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-bold">{level.level}</h2>
                    <p className="text-white/80 text-sm mt-1">
                      {levelDescriptions[level.level]}
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="mt-6 flex gap-6 text-sm">
                  <div>
                    <p className="text-white/70">Topics</p>
                    <p className="text-2xl font-semibold">{level.topicCount}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Words</p>
                    <p className="text-2xl font-semibold">{level.wordCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {levels.every((l) => l.wordCount === 0) && (
        <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-amber-600 dark:text-amber-400">
            ⚠️ No vocabulary data found. Please run the import script to
            populate the database.
          </p>
        </div>
      )}
    </div>
  );
}
