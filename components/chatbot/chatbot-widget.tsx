"use client";

import { useState } from "react";
import { ChatbotFab } from "./chatbot-fab";
import { ChatbotPanel } from "./chatbot-panel";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <>
      <ChatbotFab isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />
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
