"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CEFRProgress {
  authenticated: boolean;
  progress: Record<string, {
    learnedCount: number;
    wordIds: string[];
    byTopic: Record<string, number>;
  }>;
}

export function useCEFRProgress() {
  return useQuery<CEFRProgress>({
    queryKey: ["cefr-progress"],
    queryFn: async () => {
      const res = await fetch("/api/cefr/progress");
      if (!res.ok) throw new Error("Failed to fetch CEFR progress");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useToggleWordLearned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, learned }: { wordId: string; learned: boolean }) => {
      console.log("[useToggleWordLearned] Sending request:", { wordId, learned });
      const res = await fetch("/api/cefr/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, learned }),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error("[useToggleWordLearned] Error:", error);
        throw new Error("Failed to update word progress");
      }
      const result = await res.json();
      console.log("[useToggleWordLearned] Success:", result);
      return result;
    },
    onMutate: async ({ wordId, learned }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cefr-progress"] });
      
      // Snapshot the previous value
      const previousProgress = queryClient.getQueryData<CEFRProgress>(["cefr-progress"]);
      
      // Optimistically update
      if (previousProgress) {
        // This is a simplified optimistic update
        // The actual refetch will correct it
      }
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      console.error("[useToggleWordLearned] Mutation error:", err);
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(["cefr-progress"], context.previousProgress);
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["cefr-progress"] });
    },
  });
}

export function getProgressPercentage(
  learnedCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round((learnedCount / totalCount) * 100);
}
