"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSettingsAction,
  updateSettingsAction,
  getUserStatsAction,
} from "@/app/actions/settings";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to get user settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const result = await getSettingsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - settings rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to update user settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { theme?: string; language?: string }) => {
      const result = await updateSettingsAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate và refetch settings
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to get user statistics
 */
export function useUserStats() {
  return useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const result = await getUserStatsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });
}
