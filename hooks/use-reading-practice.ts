"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ReadingPracticeBlock } from "@/lib/reading-practice-types";

export interface ReadingPracticePart {
  id: string;
  examTitle: string;
  examCode?: string | null;
  partNumber: number;
  title: string;
  content: string;
  instructions?: string | null;
  questionBlocks: ReadingPracticeBlock[];
  totalQuestions: number;
  estimatedMinutes: number;
  level?: string | null;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  latestAttempt?: {
    score: number;
    correctCount: number;
    totalCount: number;
    completedAt: string;
  } | null;
}

export interface SubmitReadingPracticeResult {
  attempt: {
    score: number;
    correctCount: number;
    totalCount: number;
    completedAt: string;
  };
  correctCount: number;
  totalCount: number;
  score: number;
  breakdown: Array<{
    blockId: string;
    questionId: string;
    isCorrect: boolean;
    userAnswer: unknown;
    correctAnswer: unknown;
    explanation?: string;
  }>;
}

export function useReadingPracticeList() {
  return useQuery<ReadingPracticePart[]>({
    queryKey: ["reading-practice-list"],
    queryFn: async () => {
      const response = await fetch("/api/reading/practice");
      if (!response.ok) throw new Error("Failed to fetch reading practice list");
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useReadingPracticeDetail(partId: string | null) {
  return useQuery<ReadingPracticePart | null>({
    queryKey: ["reading-practice-detail", partId],
    queryFn: async () => {
      if (!partId) return null;
      const response = await fetch(`/api/reading/practice/${partId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch reading practice detail");
      }
      const data = await response.json();
      return data.data || null;
    },
    enabled: !!partId,
    staleTime: 60 * 1000,
  });
}

export function useSubmitReadingPracticeAttempt() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      partId: string;
      answers: Record<string, unknown>;
    }) => {
      const response = await fetch("/api/reading/practice/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit attempt");
      }
      return data.data as SubmitReadingPracticeResult;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reading-practice-list"] });
      queryClient.invalidateQueries({
        queryKey: ["reading-practice-detail", variables.partId],
      });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminReadingPracticeList() {
  return useQuery<
    Array<ReadingPracticePart & { _count: { attempts: number } }>
  >({
    queryKey: ["admin-reading-practice-list"],
    queryFn: async () => {
      const response = await fetch("/api/admin/reading-practice");
      if (!response.ok) throw new Error("Failed to fetch admin reading practice");
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminReadingPracticeDetail(id: string | null) {
  return useQuery<ReadingPracticePart | null>({
    queryKey: ["admin-reading-practice-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/admin/reading-practice/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch admin reading practice detail");
      }
      const data = await response.json();
      return data.data || null;
    },
    enabled: !!id,
  });
}

export function useAdminCreateReadingPractice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<ReadingPracticePart>) => {
      const response = await fetch("/api/admin/reading-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create reading practice");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reading-practice-list"] });
      toast({ title: "Reading practice created" });
    },
    onError: (error: Error) => {
      toast({
        title: "Create failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminUpdateReadingPractice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<ReadingPracticePart>) => {
      const response = await fetch(`/api/admin/reading-practice/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update reading practice");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reading-practice-list"] });
      toast({ title: "Reading practice updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminDeleteReadingPractice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/reading-practice/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete reading practice");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reading-practice-list"] });
      toast({ title: "Reading practice deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
