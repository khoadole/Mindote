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
 * Hook to create a word
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["words", variables.collectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["collections", variables.collectionId],
      });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["all-words"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast({
        title: "Word added",
        description: "Your new word has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add word",
        description: error.message,
        variant: "destructive",
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
        queryClient.invalidateQueries({
          queryKey: ["words", data.collectionId],
        });
        queryClient.invalidateQueries({
          queryKey: ["collections", data.collectionId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["all-words"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
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
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["words"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["all-words"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
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
