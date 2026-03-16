"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import {
  useChatSessions,
  useChatSession,
  useChatUsage,
  useCreateSession,
  useDeleteSession,
  useRenameSession,
  useSendMessage,
} from "@/hooks/use-chat";
import { ChatbotSessionList } from "./chatbot-session-list";
import { ChatbotMessages, ChatbotMessagesSkeleton } from "./chatbot-messages";
import { ChatbotInput } from "./chatbot-input";

interface ChatbotPanelProps {
  activeSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  onClose: () => void;
}

export function ChatbotPanel({ activeSessionId, onSelectSession, onClose }: ChatbotPanelProps) {
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const { data: sessions = [] } = useChatSessions();
  const { data: activeSession, isLoading: isLoadingSession } = useChatSession(activeSessionId);
  const { data: usage } = useChatUsage();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const renameSession = useRenameSession();
  const sendMessage = useSendMessage();

  const handleNewChat = async () => {
    const session = await createSession.mutateAsync({ title: "Cuộc hội thoại mới" });
    onSelectSession(session.id);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession.mutateAsync(id);
    if (activeSessionId === id) {
      onSelectSession(null);
    }
  };

  const handleRenameSession = (id: string, title: string) => {
    renameSession.mutate({ sessionId: id, title });
  };

  const handleSend = async (content: string) => {
    setPendingUserMessage(content);
    let sessionId = activeSessionId;

    try {
      if (!sessionId) {
        const title = content.slice(0, 60) + (content.length > 60 ? "..." : "");
        const session = await createSession.mutateAsync({ title });
        onSelectSession(session.id);
        sessionId = session.id;
      }

      await sendMessage.mutateAsync({ sessionId, content });
    } finally {
      setPendingUserMessage(null);
    }
  };

  const messages = activeSession?.messages ?? [];
  const remainingUses = usage?.remainingUses ?? 5;
  const isPremium = usage?.isPremium ?? false;

  return (
    <div className="fixed bottom-20 right-4 z-[60] flex h-[560px] w-[680px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl max-md:inset-0 max-md:bottom-0 max-md:right-0 max-md:h-full max-md:w-full max-md:rounded-none">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b px-4 py-2.5">
        <Image
          src="/chatbot_logo.png"
          alt="Mindote AI"
          width={28}
          height={28}
          className="rounded-full"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Mindote AI</span>
          <span className="text-[10px] text-muted-foreground">English Learning Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="ml-auto cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <ChatbotSessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={onSelectSession}
          onDelete={handleDeleteSession}
          onRename={handleRenameSession}
          onNewChat={handleNewChat}
          isCreating={createSession.isPending}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {isLoadingSession ? (
            <ChatbotMessagesSkeleton />
          ) : (
            <ChatbotMessages
              messages={messages}
              isSending={sendMessage.isPending}
              pendingUserMessage={pendingUserMessage}
            />
          )}

          <ChatbotInput
            onSend={handleSend}
            isSending={sendMessage.isPending || createSession.isPending}
            isDisabled={!isPremium && remainingUses === 0}
            remainingUses={remainingUses}
            isPremium={isPremium}
          />
        </div>
      </div>
    </div>
  );
}
