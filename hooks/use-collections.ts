"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCollectionsAction,
  getCollectionAction,
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
} from "@/app/actions/collections";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

/**
 * Hook to get all collections
 */
export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const result = await getCollectionsAction();
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
 * Hook to get a single collection with words
 */
export function useCollection(collectionId: string) {
  return useQuery({
    queryKey: ["collections", collectionId],
    queryFn: async () => {
      const result = await getCollectionAction(collectionId);
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
 * Hook to create a collection
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const result = await createCollectionAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });

      // ✅ Optimistic update: Increment totalCollections immediately
      queryClient.setQueryData(["user-stats"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          totalCollections: (old.totalCollections || 0) + 1,
        };
      });

      toast({
        title: "Collection created",
        description: "Your new collection has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create collection",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to update a collection
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      collectionId,
      data,
    }: {
      collectionId: string;
      data: { name?: string; color?: string };
    }) => {
      const result = await updateCollectionAction(collectionId, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({
        queryKey: ["collections", variables.collectionId],
      });
      toast({
        title: "Collection updated",
        description: "Your collection has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update collection",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete a collection
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const result = await deleteCollectionAction(collectionId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });

      // ✅ Optimistic update: Decrement totalCollections immediately
      queryClient.setQueryData(["user-stats"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          totalCollections: Math.max(0, (old.totalCollections || 0) - 1),
        };
      });

      toast({
        title: "Collection deleted",
        description: "Your collection has been deleted successfully.",
      });
      router.push("/collections");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete collection",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
