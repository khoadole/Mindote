"use client";

import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n-provider";
import { ChatbotMascot } from "./chatbot-mascot";

interface ChatbotFabProps {
  isOpen: boolean;
  onClick: () => void;
  highlight?: boolean;
}

export function ChatbotFab({ isOpen, onClick, highlight = false }: ChatbotFabProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2">
      {!isOpen && (
        <span className="hidden rounded-full border border-blue-200/80 bg-background/95 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur sm:inline-flex dark:border-blue-900/60 dark:text-blue-300">
          Mindote AI
        </span>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-transparent shadow-none transition-all duration-200 hover:scale-105 active:scale-95 ${
              highlight ? "animate-pulse" : ""
            }`}
            aria-label={t("chat.tooltip")}
          >
            {!isOpen && (
              <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold leading-none text-black shadow-sm">
                AI
              </span>
            )}

            {isOpen ? (
              <X className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            ) : (
              <ChatbotMascot size={60} className="rounded-full" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="sm:hidden">
          <p>{t("chat.tooltip")}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
