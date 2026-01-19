"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, Loader2 } from "lucide-react";

interface Topic {
  id: string;
  order: number;
  name: string;
  wordCount: number;
}

const levelColors: Record<string, string> = {
  A1: "bg-green-500",
  A2: "bg-teal-500",
  B1: "bg-blue-500",
  B2: "bg-purple-500",
  C1: "bg-orange-500",
  C2: "bg-rose-500",
};

export default function LevelPage() {
  const params = useParams();
  const level = (params.level as string)?.toUpperCase();

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
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Levels
        </Link>

        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-xl ${levelColors[level] || "bg-gray-500"} flex items-center justify-center`}
          >
            <span className="text-2xl font-bold text-white">{level}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Level {level}</h1>
            <p className="text-muted-foreground">
              {topics.length} topics •{" "}
              {topics.reduce((sum, t) => sum + t.wordCount, 0)} words
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {topics.map((topic, index) => (
          <Link
            key={topic.id}
            href={`/vocabulary/${level.toLowerCase()}/${topic.id}`}
            className="group block"
          >
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{topic.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {topic.wordCount} words
                </p>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-5 h-5" />
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No topics found for this level.</p>
        </div>
      )}
    </div>
  );
}
