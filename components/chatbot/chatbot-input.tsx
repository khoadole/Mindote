"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatbotInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  isDisabled: boolean;
  remainingUses: number;
  isPremium: boolean;
}

export function ChatbotInput({
  onSend,
  isSending,
  isDisabled,
  remainingUses,
  isPremium,
}: ChatbotInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isSending || isDisabled) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  const limitReached = !isPremium && remainingUses === 0;

  return (
    <div className="flex flex-col gap-1.5 border-t px-3 py-2">
      {limitReached && (
        <p className="text-center text-xs text-destructive">
          Đã hết 5 lượt chat miễn phí hôm nay.{" "}
          <a href="/settings" className="underline hover:no-underline">
            Nâng cấp Premium
          </a>{" "}
          để dùng không giới hạn.
        </p>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={limitReached ? "Đã hết lượt hôm nay..." : "Hỏi về từ vựng, ngữ pháp..."}
          disabled={isSending || limitReached}
          rows={1}
          maxLength={500}
          className="min-h-[40px] resize-none leading-relaxed"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!value.trim() || isSending || limitReached}
          className="h-10 w-10 shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {!limitReached && !isPremium && remainingUses > 0 && (
        <p className="text-right text-xs text-muted-foreground">
          Còn {remainingUses} tin nhắn hôm nay
        </p>
      )}
    </div>
  );
}
