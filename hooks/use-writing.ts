import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { WritingPassage, WritingAttempt, AIWritingResult } from "@/lib/types";

interface WritingPassageFilters {
  level?: string;
  topic?: string;
  search?: string;
}

interface EvaluateParams {
  passageId: string;
  userText: string;
}

interface EvaluateResult {
  attempt: WritingAttempt;
  aiResult: AIWritingResult;
  isPremium: boolean;
  remainingUses: number;
  message: string;
}

// Fetch current writing AI evaluation quota
export function useWritingUsage() {
  return useQuery<{ isPremium: boolean; remainingUses: number }>({
    queryKey: ["writing-usage"],
    queryFn: async () => {
      const response = await fetch("/api/writing/evaluate");
      if (!response.ok) throw new Error("Failed to fetch usage");
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Fetch published passages with optional filters
export function useWritingPassages(filters: WritingPassageFilters = {}) {
  const params = new URLSearchParams();
  if (filters.level) params.set("level", filters.level);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.search) params.set("search", filters.search);

  return useQuery<WritingPassage[]>({
    queryKey: ["writing-passages", filters],
    queryFn: async () => {
      const response = await fetch(`/api/writing/passages?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch writing passages");
      const data = await response.json();
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch user's last 3 attempts for a specific passage
export function useWritingAttempts(passageId: string | null) {
  return useQuery<WritingAttempt[]>({
    queryKey: ["writing-attempts", passageId],
    queryFn: async () => {
      if (!passageId) return [];
      const response = await fetch(`/api/writing/attempts?passageId=${passageId}`);
      if (!response.ok) throw new Error("Failed to fetch attempts");
      const data = await response.json();
      return data.data ?? [];
    },
    enabled: !!passageId,
    staleTime: 0, // Always fresh after evaluation
  });
}

// Evaluate user's writing with AI
export function useEvaluateWriting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<EvaluateResult, Error, EvaluateParams>({
    mutationFn: async ({ passageId, userText }) => {
      const response = await fetch("/api/writing/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passageId, userText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Evaluation failed");
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate attempts cache to show new attempt
      queryClient.invalidateQueries({
        queryKey: ["writing-attempts", variables.passageId],
      });
      // Invalidate passage list to update attempt count + last score
      queryClient.invalidateQueries({ queryKey: ["writing-passages"] });
      // Invalidate usage quota so remaining count updates
      queryClient.invalidateQueries({ queryKey: ["writing-usage"] });

      if (data.message) {
        toast({ title: "Evaluation complete", description: data.message });
      }
    },
    onError: (error) => {
      toast({
        title: "Evaluation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// ADMIN HOOKS
// ============================================

interface AdminPassage extends WritingPassage {
  _count: { attempts: number };
}

export function useAdminWritingPassages() {
  return useQuery<AdminPassage[]>({
    queryKey: ["admin-writing-passages"],
    queryFn: async () => {
      const response = await fetch("/api/admin/writing");
      if (!response.ok) throw new Error("Failed to fetch passages");
      const data = await response.json();
      return data.data ?? [];
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminCreatePassage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<WritingPassage>) => {
      const response = await fetch("/api/admin/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create passage");
      return data.data as WritingPassage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writing-passages"] });
      toast({ title: "Passage created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create passage",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminUpdatePassage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<WritingPassage> & { id: string }) => {
      const response = await fetch(`/api/admin/writing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update passage");
      return data.data as WritingPassage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writing-passages"] });
      toast({ title: "Passage updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update passage",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminDeletePassage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/writing/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete passage");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writing-passages"] });
      toast({ title: "Passage deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete passage",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
