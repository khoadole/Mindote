"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ReadingPassage {
  id: string;
  userId: string;
  collectionId: string;
  title: string;
  content: string;
  level: string;
  wordCount: number;
  estimatedTime: number;
  wordsUsed: string[];
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  createdAt: string;
  collection?: {
    id: string;
    name: string;
    color: string;
  };
  _count?: {
    attempts: number;
  };
}

interface ReadingAttempt {
  id: string;
  userId: string;
  passageId: string;
  timeSpent: number;
  score: number;
  answers: Record<number, string>;
  completedAt: string;
}

interface GeneratePassageParams {
  collectionId: string;
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  passageType?: "story" | "article" | "essay" | "news";
  language?: string;
}

interface SubmitAttemptParams {
  passageId: string;
  answers: Record<number, string>;
  timeSpent: number;
}

// Hook to generate a new reading passage
export function useGeneratePassage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GeneratePassageParams) => {
      const response = await fetch("/api/reading/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate passage");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reading-passages"] });
      toast({
        title: "✨ Passage Generated!",
        description: data.message || "Your reading passage is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to generate reading passage. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to fetch all reading passages
export function useReadingPassages(collectionId?: string) {
  return useQuery<ReadingPassage[]>({
    queryKey: ["reading-passages", collectionId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (collectionId) {
        params.append("collectionId", collectionId);
      }

      const response = await fetch(
        `/api/reading/generate?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch passages");
      }

      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch a single passage
export function useReadingPassage(passageId: string | null) {
  return useQuery<ReadingPassage | null>({
    queryKey: ["reading-passage", passageId],
    queryFn: async () => {
      if (!passageId) return null;

      const response = await fetch(`/api/reading/passage/${passageId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch passage");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!passageId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once
  });
}

// Hook to submit a reading attempt
export function useSubmitAttempt() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitAttemptParams) => {
      const response = await fetch("/api/reading/attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit attempt");
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reading-attempts", variables.passageId],
      });
      queryClient.invalidateQueries({ queryKey: ["reading-passages"] });

      const score = data.data.score;
      toast({
        title:
          score >= 80
            ? "🎉 Great Job!"
            : score >= 60
            ? "👍 Good Work!"
            : "💪 Keep Practicing!",
        description: `You scored ${score}% on this reading passage.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit your answers.",
        variant: "destructive",
      });
    },
  });
}

// Hook to fetch attempts for a passage
export function useReadingAttempts(passageId: string | null) {
  return useQuery<ReadingAttempt[]>({
    queryKey: ["reading-attempts", passageId],
    queryFn: async () => {
      if (!passageId) return [];

      const response = await fetch(
        `/api/reading/attempt?passageId=${passageId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch attempts");
      }

      const data = await response.json();
      return data.data || [];
    },
    enabled: !!passageId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
