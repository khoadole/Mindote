"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDueWords,
  getDueCount,
  getDueWordsByCollection,
} from "@/app/actions/reviews";

/**
 * Hook to get all words due for review
 */
export function useDueWords() {
  return useQuery({
    queryKey: ["dueWords"],
    queryFn: async () => {
      const result = await getDueWords();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.words || [];
    },
    staleTime: 0, // Always fresh - refetch immediately when invalidated
  });
}

/**
 * Hook to get count of words due today
 */
export function useDueCount() {
  return useQuery({
    queryKey: ["dueCount"],
    queryFn: async () => {
      const result = await getDueCount();
      return result.count || 0;
    },
    staleTime: 0, // Always fresh - refetch immediately when invalidated
    refetchInterval: 1000 * 30, // Refetch every 30 seconds as backup
  });
}

/**
 * Hook to get due words by collection
 */
export function useDueWordsByCollection(collectionId: string | null) {
  return useQuery({
    queryKey: ["dueWords", collectionId],
    queryFn: async () => {
      if (!collectionId) return [];
      const result = await getDueWordsByCollection(collectionId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.words || [];
    },
    enabled: !!collectionId,
    staleTime: 1000 * 60, // 1 minute
  });
}
