"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n-provider";

interface CalendarDay {
  date: string;
  totalEvents: number;
  hasActivity: boolean;
}

interface CalendarResponse {
  month: string;
  days: CalendarDay[];
  monthStats: {
    daysWithActivity: number;
    totalEvents: number;
  };
}

interface StreakBadgeProps {
  currentStreak: number;
}

function getLocaleFromLanguage(language: string) {
  const localeMap: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
    de: "de-DE",
    es: "es-ES",
    fr: "fr-FR",
    it: "it-IT",
    ja: "ja-JP",
    ko: "ko-KR",
    pt: "pt-PT",
    zh: "zh-CN",
  };

  return localeMap[language] || "en-US";
}

export function StreakBadge({ currentStreak }: StreakBadgeProps) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  });
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekdays = [
    t("streak.sun"),
    t("streak.mon"),
    t("streak.tue"),
    t("streak.wed"),
    t("streak.thu"),
    t("streak.fri"),
    t("streak.sat"),
  ];

  const fetchMonthData = async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/streak/calendar?month=${month}`);
      if (!res.ok) {
        throw new Error(`Failed to load calendar (${res.status})`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setCalendarData(data);
    } catch (err: any) {
      setError(err?.message || t("streak.loadingFailed"));
      setCalendarData(null);
    } finally {
      setLoading(false);
    }
  };

  const openCalendar = async () => {
    setIsOpen(true);
    await fetchMonthData(currentMonth);
  };

  const handlePrevMonth = async () => {
    const date = new Date(`${currentMonth}-01`);
    date.setMonth(date.getMonth() - 1);
    const newMonth = date.toISOString().slice(0, 7);
    setCurrentMonth(newMonth);
    await fetchMonthData(newMonth);
  };

  const handleNextMonth = async () => {
    const date = new Date(`${currentMonth}-01`);
    date.setMonth(date.getMonth() + 1);
    const newMonth = date.toISOString().slice(0, 7);
    setCurrentMonth(newMonth);
    await fetchMonthData(newMonth);
  };

  const monthGrid = useMemo(() => {
    if (!calendarData?.days?.length) {
      return [] as Array<CalendarDay | null>;
    }

    const firstDay = new Date(`${calendarData.days[0].date}T00:00:00`);
    const leadingEmpty = firstDay.getDay();
    return [
      ...Array.from({ length: leadingEmpty }, () => null),
      ...calendarData.days,
    ];
  }, [calendarData]);

  const monthLabel = new Date(`${currentMonth}-01`).toLocaleDateString(
    getLocaleFromLanguage(language),
    {
      year: "numeric",
      month: "long",
    }
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={openCalendar}
            variant="ghost"
            className="gap-2 h-auto px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40"
          >
            <span className="text-lg leading-none">🔥</span>
            <span className="font-bold text-sm">
              {t("streak.badgeDays", { count: currentStreak })}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{t("streak.tooltipOpen")}</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[620px] rounded-[28px] border border-orange-100/60 dark:border-orange-900/30 shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-0 overflow-hidden">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#c56a08_0%,#df8a16_52%,#f2b14a_100%)] px-6 py-5 text-amber-50">
            <div className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-white/14 blur-2xl" />
            <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-amber-200/14 blur-2xl" />
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-black tracking-tight">
                {t("streak.calendarTitle")}
              </DialogTitle>
            </DialogHeader>
            <div className="relative mt-2 inline-flex items-center gap-2 rounded-full bg-black/12 px-3 py-1.5 text-amber-50 ring-1 ring-white/20">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t("streak.currentStreak", { count: currentStreak })}
              </span>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-b from-white to-orange-50/20 dark:from-background dark:to-orange-950/10">
            {loading && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                {t("streak.loadingCalendar")}
              </div>
            )}

            {error && !loading && (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <p className="text-base font-semibold text-foreground">{t("streak.loadingFailed")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            )}

            {calendarData && !loading && !error && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground capitalize">{monthLabel}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevMonth}
                      className="h-9 w-9 p-0 rounded-full border-slate-300/80 hover:border-orange-300 hover:bg-orange-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextMonth}
                      className="h-9 w-9 p-0 rounded-full border-slate-300/80 hover:border-orange-300 hover:bg-orange-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {weekdays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-slate-500 py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {monthGrid.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }

                    const dayNumber = new Date(`${day.date}T00:00:00`).getDate();
                    return (
                      <div
                        key={day.date}
                        className={cn(
                          "aspect-square rounded-2xl border flex items-center justify-center text-sm font-semibold transition-all",
                          day.hasActivity
                            ? "bg-amber-200 text-amber-900 border-amber-400 shadow-[0_8px_18px_rgba(245,158,11,0.25)]"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        )}
                      >
                        {dayNumber}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {t("streak.daysLearnedInMonth", {
                      count: calendarData.monthStats.daysWithActivity,
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export default StreakBadge;
