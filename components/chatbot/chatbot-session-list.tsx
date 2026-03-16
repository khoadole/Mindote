"use client";

import { useState, useRef, useEffect } from "react";
import { PenLine, Trash2, MessageSquare, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/hooks/use-chat";

interface ChatbotSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onNewChat: () => void;
  isCreating: boolean;
}

export function ChatbotSessionList({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onRename,
  onNewChat,
  isCreating,
}: ChatbotSessionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  const startEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r">
      <div className="p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={onNewChat}
          disabled={isCreating}
        >
          <PenLine className="h-3.5 w-3.5" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-1.5">
          {sessions.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              Chưa có cuộc hội thoại nào
            </p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative flex cursor-pointer items-start gap-1.5 rounded-lg px-2 py-2 text-xs transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30",
                activeSessionId === session.id && "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
                editingId === session.id && "bg-blue-50 dark:bg-blue-950/30"
              )}
              onClick={() => {
                if (editingId !== session.id) onSelect(session.id);
              }}
            >
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

              {editingId === session.id ? (
                /* Inline rename input */
                <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onBlur={commitEdit}
                    className="min-w-0 flex-1 rounded border border-border bg-background px-1 py-0.5 text-xs outline-none focus:border-blue-500"
                    maxLength={100}
                  />
                  <button
                    onMouseDown={(e) => { e.preventDefault(); commitEdit(); }}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                    className="cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                /* Normal title + action buttons */
                <>
                  <span className="flex-1 truncate leading-snug">{session.title}</span>
                  <div className="absolute right-1.5 top-1.5 hidden items-center gap-0.5 group-hover:flex">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(session); }}
                      className="cursor-pointer rounded p-0.5 text-muted-foreground hover:text-blue-600"
                      aria-label="Rename"
                    >
                      <PenLine className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                      className="cursor-pointer rounded p-0.5 text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
