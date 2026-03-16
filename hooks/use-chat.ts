import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatUsage {
  isPremium: boolean;
  count: number;
  remainingUses: number;
}

export function useChatUsage() {
  return useQuery<ChatUsage>({
    queryKey: ["chat-usage"],
    queryFn: async () => {
      const res = await fetch("/api/chat");
      if (!res.ok) throw new Error("Failed to fetch usage");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useChatSessions() {
  return useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/chat/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      return data.sessions ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useChatSession(sessionId: string | null) {
  return useQuery<ChatSession & { messages: ChatMessage[] }>({
    queryKey: ["chat-session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      const data = await res.json();
      return data.session;
    },
    enabled: !!sessionId,
    staleTime: 0,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation<ChatSession, Error, { title: string }>({
    mutationFn: async ({ title }) => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      return data.session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      // Pre-populate session cache ngay → tránh skeleton flash khi select session mới
      queryClient.setQueryData(["chat-session", session.id], { ...session, messages: [] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (sessionId) => {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete session");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete session", variant: "destructive" });
    },
  });
}

export function useRenameSession() {
  const queryClient = useQueryClient();

  return useMutation<ChatSession, Error, { sessionId: string; title: string }>({
    mutationFn: async ({ sessionId, title }) => {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to rename session");
      const data = await res.json();
      return data.session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    { userMessage: ChatMessage; assistantMessage: ChatMessage; remainingUses: number },
    Error,
    { sessionId: string; content: string }
  >({
    mutationFn: async ({ sessionId, content }) => {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to send message");
      }
      return data;
    },
    onSuccess: (data, variables) => {
      // Update cache trực tiếp thay vì invalidate → tránh flicker
      // setQueryData là synchronous, React 18 sẽ batch cùng với setPendingUserMessage(null)
      queryClient.setQueryData(
        ["chat-session", variables.sessionId],
        (old: (ChatSession & { messages: ChatMessage[] }) | undefined) => {
          const base = old ?? { id: variables.sessionId, title: "", createdAt: "", updatedAt: "", messages: [] };
          return {
            ...base,
            messages: [...(base.messages ?? []), data.userMessage, data.assistantMessage],
          };
        }
      );
      // Chỉ invalidate usage và sessions list (không cần refetch messages)
      queryClient.invalidateQueries({ queryKey: ["chat-usage"] });
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
