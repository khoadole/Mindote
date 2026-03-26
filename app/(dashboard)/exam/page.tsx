"use client";

import { FileWarning } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";

export default function ExamPage() {
  const { t } = useTranslation();

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-background transition-all duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-stone-200 dark:border-border bg-white dark:bg-card p-8 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
              <FileWarning className="h-5 w-5 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t("sidebar.exam")}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("common.featureWillBeUpdated")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
