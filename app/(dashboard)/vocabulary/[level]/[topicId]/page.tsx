"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Volume2 } from "lucide-react";

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

export default function TopicWordsPage() {
  const params = useParams();
  const level = (params.level as string)?.toUpperCase();
  const topicId = params.topicId as string;

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
      // Cancel any ongoing speech
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
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Topic not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/vocabulary/${level.toLowerCase()}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {level} Topics
        </Link>

        <h1 className="text-2xl font-bold">{topic.name}</h1>
        <p className="text-muted-foreground">
          {level} • {words.length} words
        </p>
      </div>

      <div className="space-y-4">
        {words.map((word) => (
          <div
            key={word.id}
            className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-xl font-semibold">{word.term}</h3>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {word.pos}
                  </span>
                </div>

                {word.phonetic && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {word.phonetic}
                  </p>
                )}

                <p className="mt-3">{word.definition}</p>

                {word.example && (
                  <p className="mt-2 text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                    "{word.example}"
                  </p>
                )}
              </div>

              <button
                onClick={() => speak(word.term)}
                className="flex-shrink-0 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                title="Listen to pronunciation"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {words.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No words found in this topic.</p>
        </div>
      )}
    </div>
  );
}
