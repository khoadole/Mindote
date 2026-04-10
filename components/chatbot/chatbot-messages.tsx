"use client";

import { useRef, useEffect, Fragment } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/hooks/use-chat";

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function renderContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trimStart();

    // Headings — hiện như bold thay vì literal ###
    if (trimmed.startsWith("### ")) {
      return (
        <p key={i} className="mt-1 font-semibold">
          {renderInlineMarkdown(trimmed.slice(4))}
        </p>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <p key={i} className="mt-1 font-semibold">
          {renderInlineMarkdown(trimmed.slice(3))}
        </p>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <p key={i} className="mt-1 font-semibold">
          {renderInlineMarkdown(trimmed.slice(2))}
        </p>
      );
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      return (
        <div key={i} className="flex gap-1.5">
          <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
          <span>{renderInlineMarkdown(trimmed.slice(2))}</span>
        </div>
      );
    }

    // Ordered list (1. 2. 3.)
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (orderedMatch) {
      return (
        <div key={i} className="flex gap-1.5">
          <span className="mt-0.5 shrink-0 text-muted-foreground">{orderedMatch[1]}.</span>
          <span>{renderInlineMarkdown(orderedMatch[2])}</span>
        </div>
      );
    }

    // Empty line
    if (trimmed === "") {
      return <div key={i} className="h-1" />;
    }

    return <div key={i}>{renderInlineMarkdown(line)}</div>;
  });
}

interface ChatbotMessagesProps {
  messages: ChatMessage[];
  isSending: boolean;
  pendingUserMessage?: string | null;
}

export function ChatbotMessages({ messages, isSending, pendingUserMessage }: ChatbotMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isSending, pendingUserMessage]);

  if (messages.length === 0 && !isSending && !pendingUserMessage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
        <Image
          src="/chatbot_logo.png"
          alt="Mindote AI"
          width={56}
          height={56}
          className="rounded-full opacity-60"
        />
        <p className="text-sm">
          Hỏi về từ vựng, ngữ pháp, tiến độ học tập, hoặc hỗ trợ tài khoản Mindote.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {msg.role === "assistant" && (
              <div className="mt-1 shrink-0">
                <Image
                  src="/chatbot_logo.png"
                  alt="Mindote AI"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {renderContent(msg.content)}
            </div>
          </div>
        ))}

        {/* Hiện tin nhắn user ngay khi đang chờ response */}
        {pendingUserMessage && (
          <div className="flex flex-row-reverse gap-2">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-500 px-3.5 py-2.5 text-sm leading-relaxed text-white opacity-80">
              {pendingUserMessage}
            </div>
          </div>
        )}

        {isSending && (
          <div className="flex gap-2">
            <div className="mt-1 shrink-0">
              <Image
                src="/chatbot_logo.png"
                alt="Mindote AI"
                width={28}
                height={28}
                className="rounded-full"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatbotMessagesSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 px-4 py-3">
      <div className="flex gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-16 w-2/3 rounded-2xl" />
      </div>
      <div className="flex flex-row-reverse gap-2">
        <Skeleton className="h-10 w-1/2 rounded-2xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-20 w-3/4 rounded-2xl" />
      </div>
    </div>
  );
}
