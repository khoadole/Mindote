"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n-provider";
import { ChatbotFab } from "./chatbot-fab";
import { ChatbotPanel } from "./chatbot-panel";
import { ChatbotMascot } from "./chatbot-mascot";

const CHATBOT_NUDGE_KEY = "mindote-chatbot-nudge-seen-v1";

export function ChatbotWidget() {
  const { t } = useTranslation();
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
          className="fixed bottom-20 right-4 z-[59] max-w-[240px] rounded-2xl border border-border bg-background/95 px-4 py-2.5 text-left shadow-xl shadow-black/10 backdrop-blur transition-colors hover:bg-muted"
          aria-label="Open Mindote AI assistant"
        >
          <div className="flex items-center gap-2">
            <ChatbotMascot size={32} className="shrink-0 rounded-full" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {t("chat.title")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("chat.tooltip")}
              </p>
            </div>
          </div>
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
