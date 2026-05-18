"use client";

import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useUserStats } from "@/hooks/use-settings";
import { useDueCount } from "@/hooks/use-reviews";
import { useLastSevenDaysActivity } from "@/hooks/use-activity-logger";
import { Button } from "@/components/ui/button";
import { WordCommandSearch } from "@/components/dashboard/word-command-search";
import {
  Candy as Cards,
  Flame,
  Zap,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n-provider";

// Card wrapper — ấm, Claude-style
function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-card rounded-2xl border border-stone-200 dark:border-border shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

// Section label — Claude editorial style
function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-4">
      {Icon && <Icon className="h-3 w-3 text-stone-400 dark:text-muted-foreground" />}
      <span className="text-[10px] font-semibold text-stone-400 dark:text-muted-foreground uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: stats } = useUserStats();
  const { data: dueCount = 0, isLoading: dueLoading } = useDueCount();

  useKeyboardShortcuts();

  const { data: activityDays } = useLastSevenDaysActivity();

  const totalWords = stats?.totalWords || 0;
  const masteredWords = stats?.masterWords || 0;
  const currentStreak = stats?.currentStreak || 0;

  const streakDays = useMemo(() => {
    const today = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const daysAgo = 6 - i;
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

      // Check if this day has activity from API
      const activityForDay = activityDays?.find(
        (day: any) => day.date === dateStr
      );
      const hasActivity = activityForDay
        ? activityForDay.hasActivity
        : false;

      return {
        day: dayNames[date.getDay()],
        date: date.getDate(),
        isToday: daysAgo === 0,
        hasActivity,
        activityCount: activityForDay?.totalEvents || 0,
      };
    });
  }, [currentStreak, activityDays]);

  const statItems = [
    {
      label: t("dashboard.new"),
      value: stats?.newWords || 0,
      dot: "bg-stone-400",
    },
    {
      label: t("dashboard.learning"),
      value: stats?.learningWords || 0,
      dot: "bg-amber-400",
    },
    {
      label: t("dashboard.familiar"),
      value: stats?.familiarWords || 0,
      dot: "bg-blue-400",
    },
    {
      label: t("dashboard.master"),
      value: masteredWords,
      dot: "bg-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 p-4 dark:bg-background md:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <WordCommandSearch />

        {/* Top 3 panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* PROGRESS — total + 2×2 stats */}
          <Panel className="p-5">
            <SectionLabel icon={Trophy}>{t("dashboard.progress")}</SectionLabel>
            <div className="mb-4">
              <div className="text-4xl font-black text-stone-900 dark:text-foreground leading-none">
                {totalWords}
              </div>
              <div className="text-xs text-stone-400 dark:text-muted-foreground mt-1">
                {t("dashboard.totalWords")}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {statItems.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-muted/40"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div>
                    <div className="text-base font-bold text-stone-800 dark:text-foreground leading-none">
                      {s.value}
                    </div>
                    <div className="text-[11px] text-stone-400 dark:text-muted-foreground mt-0.5">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* STREAK — Duolingo energy: số cam to, bars thoáng */}
          <Panel className="p-5">
            <SectionLabel icon={Flame}>{t("dashboard.streakCalendar")}</SectionLabel>
            <div className="flex items-end justify-between mb-5">
              <div className="flex items-end gap-2">
                <span
                  className={`text-5xl font-black leading-none ${
                    currentStreak > 0
                      ? "text-orange-500"
                      : "text-stone-300 dark:text-muted-foreground"
                  }`}
                >
                  {currentStreak}
                </span>
                <div className="mb-1">
                  <div className="text-xl leading-none">{currentStreak > 0 ? "🔥" : "❄️"}</div>
                  <div className="text-[11px] text-stone-400 dark:text-muted-foreground mt-0.5">
                    {t("dashboard.dayStreak", { count: currentStreak })}
                  </div>
                </div>
              </div>
            </div>

            {/* Duolingo-style day circles */}
            <div className="flex items-center gap-1">
              {streakDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2.5 flex-1">
                  <div
                    className={`w-full aspect-square max-w-[36px] mx-auto rounded-full flex items-center justify-center transition-all duration-200 ${
                      day.hasActivity
                        ? "bg-gradient-to-b from-orange-400 to-orange-500 shadow-[0_3px_10px_rgba(251,146,60,0.4)]"
                        : "bg-stone-100 dark:bg-muted/50"
                    } ${
                      day.isToday
                        ? "ring-2 ring-orange-400 ring-offset-2 ring-offset-white dark:ring-offset-card scale-110"
                        : ""
                    }`}
                  >
                    {day.hasActivity && (
                      <Flame className="h-4 w-4 text-white drop-shadow-sm" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium tabular-nums leading-none ${
                      day.isToday
                        ? "text-orange-500 font-semibold"
                        : "text-stone-300 dark:text-muted-foreground"
                    }`}
                  >
                    {day.date}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* QUICK REVIEW — hero khi có words, calm khi done */}
          <div
            className={`rounded-2xl border transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 ${
              dueCount > 0
                ? "bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/40"
                : "bg-white dark:bg-card border-stone-200 dark:border-border"
            }`}
          >
            <div className="p-5 h-full flex flex-col">
              <SectionLabel icon={Zap}>{t("dashboard.quickRevision")}</SectionLabel>

              {dueLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : dueCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-stone-700 dark:text-foreground">
                      {t("dashboard.allCaughtUp")}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-muted-foreground mt-0.5">
                      Come back tomorrow!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-1 py-2">
                  <div className="text-6xl font-black text-amber-500 leading-none">
                    {dueCount}
                  </div>
                  <p className="text-sm text-stone-500 dark:text-muted-foreground">
                    {t("dashboard.wordsToReview", { count: dueCount })}
                  </p>
                </div>
              )}

              <Button
                className={`w-full rounded-xl font-semibold mt-3 ${
                  dueCount > 0
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
                    : ""
                }`}
                size="sm"
                asChild={dueCount > 0}
                disabled={dueCount === 0}
              >
                {dueCount > 0 ? (
                  <Link href="/flashcards?mode=review" className="flex items-center gap-2">
                    <Cards className="h-4 w-4" />
                    {t("dashboard.startFlashcards")}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2">
                    <Cards className="h-4 w-4" />
                    {t("dashboard.startFlashcards")}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
