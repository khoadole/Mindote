"use client";

import type React from "react";
import { useMemo } from "react";
import Link from "next/link";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useUserStats } from "@/hooks/use-settings";
import { useDueCount } from "@/hooks/use-reviews";
import { useLastSevenDaysActivity } from "@/hooks/use-activity-logger";
import { Button } from "@/components/ui/button";
import { WordCommandSearch } from "@/components/dashboard/word-command-search";
import { Candy as Cards, CheckCircle2, Flame, Trophy, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-border dark:bg-card ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-1.5">
      {Icon && (
        <Icon className="h-3 w-3 text-stone-400 dark:text-muted-foreground" />
      )}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  percent,
  barClassName,
}: {
  label: string;
  value: number;
  percent: number;
  barClassName: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
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
      const dateStr = date.toISOString().split("T")[0];
      const activityForDay = activityDays?.find(
        (day: any) => day.date === dateStr,
      );

      return {
        day: dayNames[date.getDay()],
        date: date.getDate(),
        isToday: daysAgo === 0,
        hasActivity: activityForDay ? activityForDay.hasActivity : false,
      };
    });
  }, [activityDays]);

  const progressItems = [
    {
      label: t("dashboard.new"),
      value: stats?.newWords || 0,
      barClassName: "bg-stone-400",
    },
    {
      label: t("dashboard.learning"),
      value: stats?.learningWords || 0,
      barClassName: "bg-amber-500",
    },
    {
      label: t("dashboard.familiar"),
      value: stats?.familiarWords || 0,
      barClassName: "bg-blue-500",
    },
    {
      label: t("dashboard.master"),
      value: masteredWords,
      barClassName: "bg-emerald-500",
    },
  ].map((item) => ({
    ...item,
    percent:
      totalWords > 0 ? Math.round((item.value / totalWords) * 100) : 0,
  }));

  const studyHref = "/collections";

  return (
    <div className="min-h-screen bg-stone-50 p-4 dark:bg-background md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <WordCommandSearch />

        <Panel className="p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
            <div>
              <SectionLabel icon={Zap}>{t("dashboard.reviewToday")}</SectionLabel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-normal text-foreground md:text-3xl">
                    {dueCount > 0
                      ? t("dashboard.dueWordsToday", { count: dueCount })
                      : t("dashboard.noDueWordsToday")}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {dueCount > 0
                      ? t("dashboard.reviewTodayHint")
                      : t("dashboard.reviewDoneHint")}
                  </p>
                </div>

                {dueLoading ? (
                  <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    {t("dashboard.searchingWords")}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-border dark:bg-background/50">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("dashboard.wordsToReview", { count: dueCount })}
                </span>
                {dueCount === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Cards className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div
                className={`mb-4 text-4xl font-black leading-none tabular-nums ${
                  dueCount > 0 ? "text-amber-500" : "text-foreground"
                }`}
              >
                {dueCount}
              </div>
              <Button
                className="h-11 w-full rounded-xl bg-amber-500 font-semibold text-white shadow-sm hover:bg-amber-600"
                asChild={dueCount > 0}
                disabled={dueCount === 0 || dueLoading}
              >
                {dueCount > 0 ? (
                  <Link href="/flashcards?mode=review" className="flex items-center gap-2">
                    <Cards className="h-4 w-4" />
                    {t("dashboard.startReview")}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2">
                    <Cards className="h-4 w-4" />
                    {t("dashboard.startReview")}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel className="p-5">
            <SectionLabel icon={Trophy}>{t("dashboard.learningProgress")}</SectionLabel>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="text-4xl font-black leading-none text-foreground">
                  {totalWords}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("dashboard.totalSavedWords")}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {t("dashboard.progressBreakdown")}
              </div>
            </div>

            <div className="space-y-4">
              {progressItems.map((item) => (
                <ProgressRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  percent={item.percent}
                  barClassName={item.barClassName}
                />
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionLabel icon={Flame}>{t("dashboard.studyCalendar")}</SectionLabel>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-end gap-2">
                  <span
                    className={`text-4xl font-black leading-none tabular-nums ${
                      currentStreak > 0 ? "text-amber-500" : "text-foreground"
                    }`}
                  >
                    {currentStreak}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    {t("dashboard.dayStreak", { count: currentStreak })}
                  </span>
                </div>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {currentStreak > 0
                    ? t("dashboard.streakActiveHint")
                    : t("dashboard.streakEmptyHint")}
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <Link href={studyHref}>{t("dashboard.studyNow")}</Link>
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {streakDays.map((day) => (
                <div key={`${day.day}-${day.date}`} className="text-center">
                  <div
                    className={`mx-auto flex aspect-square max-w-10 items-center justify-center rounded-full border transition-colors ${
                      day.hasActivity
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-border bg-muted/40 text-muted-foreground"
                    } ${day.isToday ? "ring-1 ring-amber-400 ring-offset-2 ring-offset-background" : ""}`}
                  >
                    {day.hasActivity ? (
                      <Flame className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold tabular-nums">
                        {day.date}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
