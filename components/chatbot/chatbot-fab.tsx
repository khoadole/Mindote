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
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background/95 px-3 text-sm font-semibold text-foreground shadow-lg shadow-black/10 backdrop-blur transition-all duration-200 hover:border-primary/40 hover:bg-muted active:scale-95 ${
              highlight ? "animate-pulse" : ""
            }`}
            aria-label={t("chat.tooltip")}
          >
            {isOpen ? (
              <X className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChatbotMascot size={28} className="rounded-full" />
            )}
            <span className="hidden sm:inline">{t("chat.title")}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="sm:hidden">
          <p>{t("chat.tooltip")}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
