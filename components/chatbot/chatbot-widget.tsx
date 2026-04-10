"use client";

import { useEffect, useState } from "react";
import { ChatbotFab } from "./chatbot-fab";
import { ChatbotPanel } from "./chatbot-panel";

const CHATBOT_NUDGE_KEY = "mindote-chatbot-nudge-seen-v1";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNudge, setShowNudge] = useState(false);

  const dismissNudge = (persist = true) => {
    setShowNudge(false);
    if (persist && typeof window !== "undefined") {
      localStorage.setItem(CHATBOT_NUDGE_KEY, "1");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(CHATBOT_NUDGE_KEY) === "1") return;

    const showTimer = window.setTimeout(() => setShowNudge(true), 1200);
    const hideTimer = window.setTimeout(() => dismissNudge(true), 12000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const handleToggle = () => {
    if (showNudge) dismissNudge(true);
    setIsOpen((v) => !v);
  };

  return (
    <>
      {showNudge && !isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-24 right-4 z-[59] max-w-[260px] rounded-2xl border border-blue-200/80 bg-background/95 px-4 py-2.5 text-left shadow-xl backdrop-blur transition-colors hover:bg-blue-50 dark:border-blue-900/60 dark:hover:bg-blue-950/30"
          aria-label="Open Mindote AI assistant"
        >
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Mindote AI</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cần hỗ trợ? Hỏi về từ vựng, ngữ pháp, hoặc tiến độ học tập của bạn.
          </p>
        </button>
      )}

      <ChatbotFab isOpen={isOpen} onClick={handleToggle} highlight={showNudge && !isOpen} />
      {isOpen && (
        <ChatbotPanel
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
