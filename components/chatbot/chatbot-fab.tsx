"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n-provider";

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
            className={`relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-500 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-600 hover:shadow-xl active:scale-95 ${
              highlight ? "animate-pulse ring-4 ring-blue-200 dark:ring-blue-900/70" : ""
            }`}
            aria-label={t("chat.tooltip")}
          >
            {!isOpen && (
              <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold leading-none text-black shadow-sm">
                AI
              </span>
            )}

            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Image
                src="/chatbot_logo.png"
                alt="Mindote AI"
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
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
