"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n-provider";

interface ChatbotFabProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatbotFab({ isOpen, onClick }: ChatbotFabProps) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="fixed bottom-4 right-4 z-[60] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-500 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-600 hover:shadow-xl active:scale-95"
          aria-label={t("chat.tooltip")}
        >
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
      <TooltipContent side="left">
        <p>{t("chat.tooltip")}</p>
      </TooltipContent>
    </Tooltip>
  );
}
