"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSettingsAction,
  updateSettingsAction,
  getUserStatsAction,
} from "@/app/actions/settings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

/**
 * Hook to get user settings
 * ✅ FIX: Only fetch when user is authenticated
 */
export function useSettings() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      const result = await getSettingsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !authLoading && !!user, // ✅ Only fetch when user is authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1, // ✅ Only retry once on error
  });
}

/**
 * Hook to update user settings
 * ✅ OPTIMIZED: Optimistic updates for instant UI response
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { theme?: string; language?: string }) => {
      const result = await updateSettingsAction(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    // ✅ OPTIMISTIC UPDATE: Update cache immediately before API call
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["settings", user?.id] });

      // Snapshot the previous value for rollback
      const previousSettings = queryClient.getQueryData(["settings", user?.id]);

      // Optimistically update cache
      queryClient.setQueryData(["settings", user?.id], (old: any) => ({
        ...old,
        ...newSettings,
      }));

      // Return context for rollback
      return { previousSettings };
    },
    onSuccess: () => {
      // ✅ No need to invalidate or show toast for theme changes
      // Settings are already updated optimistically
      // Silent success for better UX
    },
    onError: (error: Error, _newSettings, context) => {
      // ✅ Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          ["settings", user?.id],
          context.previousSettings
        );
      }

      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
    // ✅ Always refetch in background to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", user?.id] });
    },
  });
}

/**
 * Hook to get user statistics
 * ✅ Longer cache time - stats don't need to be real-time
 * ✅ FIX: Only fetch when user is authenticated
 */
export function useUserStats() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      const result = await getUserStatsAction();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !authLoading && !!user, // ✅ Only fetch when user is authenticated
    staleTime: 30 * 60 * 1000, // 30 minutes - stats are updated optimistically by mutations
    gcTime: 60 * 60 * 1000, // 60 minutes
    retry: 1, // ✅ Only retry once on error
  });
}
