"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Candy as Cards, CheckCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n-provider";

type WordPracticeTab = "flashcards" | "quiz";

type WordPracticeTabsProps = {
  active: WordPracticeTab;
};

export function WordPracticeTabs({ active }: WordPracticeTabsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const collection = searchParams.get("collection");

  const buildHref = (tab: WordPracticeTab) => {
    const path = tab === "flashcards" ? "/flashcards" : "/quiz";
    return collection ? `${path}?collection=${collection}` : path;
  };

  return (
    <Tabs
      value={active}
      onValueChange={(value) => router.push(buildHref(value as WordPracticeTab))}
      className="animate-in fade-in slide-in-from-top-2 duration-500"
    >
      <div className="inline-flex w-fit self-start rounded-xl border border-stone-300 bg-white/60 p-1 dark:border-border dark:bg-card/60">
        <TabsList className="h-10 bg-transparent p-0">
          <TabsTrigger value="flashcards" className="gap-2 px-4">
            <Cards className="h-4 w-4" />
            {t("sidebar.flashcards")}
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2 px-4">
            <CheckCircle className="h-4 w-4" />
            {t("sidebar.quiz")}
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
}
