"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWordsAction,
  getAllWordsAction,
  createWordAction,
  updateWordAction,
  deleteWordAction,
  searchWordsAction,
} from "@/app/actions/words";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to get all words for current user (for Quiz and Flashcards)
 */
export function useAllWords() {
  return useQuery({
    queryKey: ["all-words"],
    queryFn: async () => {
      const result = await getAllWordsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get all words for a collection
 */
export function useWords(collectionId: string) {
  return useQuery({
    queryKey: ["words", collectionId],
    queryFn: async () => {
      const result = await getWordsAction(collectionId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a word with optimistic updates
 */
export function useCreateWord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      collectionId: string;
      term: string;
      definition: string;
      example?: string;
      phonetic?: string;
    }) => {
      const result = await createWordAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    // OPTIMISTIC UPDATE: Update UI immediately before API call
    onMutate: async (newWord) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["words", newWord.collectionId],
      });

      // Snapshot previous value
      const previousWords = queryClient.getQueryData([
        "words",
        newWord.collectionId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["words", newWord.collectionId],
        (old: any[] | undefined) => {
          const optimisticWord = {
            id: `temp-${Date.now()}`, // Temporary ID
            term: newWord.term,
            definition: newWord.definition,
            example: newWord.example || null,
            phonetic: newWord.phonetic || null,
            score: 0,
            createdAt: new Date().toISOString(),
            collectionId: newWord.collectionId,
            _optimistic: true, // Flag for UI indicator
          };
          return [optimisticWord, ...(old || [])];
        }
      );

      // Return context with snapshot
      return { previousWords };
    },
    onSuccess: (_, variables) => {
      // Only invalidate the specific collection's words and details
      queryClient.invalidateQueries({
        queryKey: ["words", variables.collectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["collections", variables.collectionId],
      });

      // Invalidate collections list (for word count update)
      queryClient.invalidateQueries({
        queryKey: ["collections"],
        refetchType: "none", // Don't auto-refetch, let it happen on next visit
      });

      // Invalidate all-words only if currently being used (Quiz/Flashcards)
      const allWordsQuery = queryClient.getQueryState(["all-words"]);
      if (allWordsQuery?.dataUpdatedAt) {
        queryClient.invalidateQueries({
          queryKey: ["all-words"],
          refetchType: "none", // Don't auto-refetch
        });
      }

      // ✅ Optimistic update: Increment totalWords immediately
      queryClient.setQueryData(["user-stats"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          totalWords: (old.totalWords || 0) + 1,
        };
      });

      toast({
        title: "Word added",
        description: "Your new word has been added successfully.",
      });
    },
    // ROLLBACK: If mutation fails, rollback to previous state
    onError: (error: Error, variables, context) => {
      // Restore previous state
      if (context?.previousWords) {
        queryClient.setQueryData(
          ["words", variables.collectionId],
          context.previousWords
        );
      }

      toast({
        title: "Failed to add word",
        description: error.message,
        variant: "destructive",
      });
    },
    // Always refetch after error or success
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["words", variables.collectionId],
      });
    },
  });
}

/**
 * Hook to update a word
 */
export function useUpdateWord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      wordId,
      data,
    }: {
      wordId: string;
      data: {
        term?: string;
        definition?: string;
        example?: string;
        phonetic?: string;
        score?: number;
      };
    }) => {
      const result = await updateWordAction(wordId, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (data?.collectionId) {
        // Only invalidate specific collection queries
        queryClient.invalidateQueries({
          queryKey: ["words", data.collectionId],
        });
        queryClient.invalidateQueries({
          queryKey: ["collections", data.collectionId],
        });
      }

      // Don't auto-refetch all-words unless currently viewing
      const allWordsQuery = queryClient.getQueryState(["all-words"]);
      if (allWordsQuery?.dataUpdatedAt) {
        queryClient.invalidateQueries({
          queryKey: ["all-words"],
          refetchType: "none",
        });
      }

      // Stats only update if score changed
      if (data?.score !== undefined) {
        queryClient.invalidateQueries({
          queryKey: ["user-stats"],
          refetchType: "none",
        });
      }

      toast({
        title: "Word updated",
        description: "Your word has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update word",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete a word
 */
export function useDeleteWord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (wordId: string) => {
      const result = await deleteWordAction(wordId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate all word-related queries but don't auto-refetch
      queryClient.invalidateQueries({
        queryKey: ["words"],
        refetchType: "active", // Only refetch currently mounted queries
      });
      queryClient.invalidateQueries({
        queryKey: ["collections"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["all-words"],
        refetchType: "none",
      });

      // ✅ Optimistic update: Decrement totalWords immediately
      queryClient.setQueryData(["user-stats"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          totalWords: Math.max(0, (old.totalWords || 0) - 1),
        };
      });

      toast({
        title: "Word deleted",
        description: "Your word has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete word",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to search words
 */
export function useSearchWords(query: string) {
  return useQuery({
    queryKey: ["search-words", query],
    queryFn: async () => {
      const result = await searchWordsAction(query);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search
    gcTime: 5 * 60 * 1000,
  });
}
