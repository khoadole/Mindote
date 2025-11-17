"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AIFillData {
  term: string;
  definition: string;
  example: string;
  phonetic: string;
  partOfSpeech: string;
}

interface AIFillResponse {
  success: boolean;
  data: AIFillData;
  remainingUses: number;
  message: string;
}

interface AIUsageInfo {
  remainingUses: number;
  totalLimit: number;
  used: number;
  canUse: boolean;
}

export function useAIFill() {
  const [isLoading, setIsLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState<AIUsageInfo | null>(null);
  const { toast } = useToast();

  const fetchUsageInfo = async () => {
    try {
      const response = await fetch("/api/ai/fill-word");
      if (response.ok) {
        const data = await response.json();
        setUsageInfo(data);
        return data;
      }
    } catch (error) {
      console.error("Failed to fetch usage info:", error);
    }
    return null;
  };

  const fillWord = async (
    term: string,
    languages?: {
      termLanguage?: string;
      definitionLanguage?: string;
      exampleLanguage?: string;
    }
  ): Promise<AIFillData | null> => {
    if (!term.trim()) {
      toast({
        title: "Error",
        description: "Please enter a term first",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/fill-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          term: term.trim(),
          ...languages,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Daily Limit Reached",
            description:
              result.message ||
              "You've used all your free AI fills for today. Upgrade to premium for unlimited access!",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to generate AI content",
            variant: "destructive",
          });
        }
        return null;
      }

      const aiResponse: AIFillResponse = result;

      // Update usage info
      setUsageInfo({
        remainingUses: aiResponse.remainingUses,
        totalLimit: 3,
        used: 3 - aiResponse.remainingUses,
        canUse: aiResponse.remainingUses > 0,
      });

      toast({
        title: "✨ AI Auto-fill Complete",
        description: aiResponse.message,
      });

      return aiResponse.data;
    } catch (error: any) {
      console.error("AI Fill error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to AI service. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fillWord,
    isLoading,
    usageInfo,
    fetchUsageInfo,
  };
}
