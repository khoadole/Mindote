/**
 * Streak Calendar Popover
 * 
 * Shows a calendar of learning activities for the current month
 * Tooltips on each day show activity breakdown
 */

"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarDay {
  date: string;
  totalEvents: number;
  hasActivity: boolean;
  types: {
    review: number;
    reading_attempt: number;
    writing_attempt: number;
    cefr_learn: number;
  };
}

interface CalendarResponse {
  month: string;
  days: CalendarDay[];
  monthStats: {
    daysWithActivity: number;
    totalEvents: number;
  };
}

export function StreakCalendarPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM format
  });

  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar data when month changes
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    fetch(`/api/streak/calendar?month=${currentMonth}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setCalendarData(null);
        } else {
          setCalendarData(data);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch calendar:", err);
        setError(err.message || "Failed to load calendar");
        setCalendarData(null);
        setLoading(false);
      });
  }, [currentMonth, isOpen]);

  const handlePrevMonth = () => {
    const date = new Date(currentMonth + "-01");
    date.setMonth(date.getMonth() - 1);
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const date = new Date(currentMonth + "-01");
    date.setMonth(date.getMonth() + 1);
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  const getDayActivityColor = (totalEvents: number): string => {
    if (totalEvents === 0) return "bg-gray-100 dark:bg-gray-800";
    if (totalEvents === 1) return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
    if (totalEvents <= 3) return "bg-green-200 dark:bg-green-800/40 border-green-400 dark:border-green-600";
    return "bg-green-400 dark:bg-green-700 border-green-500 dark:border-green-500";
  };

  const getActivityTypeEmoji = (type: string): string => {
    switch (type) {
      case "review":
        return "📚";
      case "reading_attempt":
        return "📖";
      case "writing_attempt":
        return "✍️";
      case "cefr_learn":
        return "🎯";
      default:
        return "✓";
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00Z");
    return date.getDate().toString();
  };

  const getDayOfWeek = (dateStr: string): number => {
    const date = new Date(dateStr + "T00:00:00Z");
    return date.getUTCDay();
  };

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-auto px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-800/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40"
              >
                <span className="text-lg leading-none">🔥</span>
                <span className="font-bold text-sm" id="streak-badge">
                  Streak
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">Do an activity today to continue your streak!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Reviews, Reading, Writing, and CEFR learning all count.
              </p>
            </TooltipContent>
          </Tooltip>
        </PopoverTrigger>

        <PopoverContent className="w-full max-w-sm p-4">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-2">Calendar not available yet</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">Activity tracking will be available after system update</p>
              </div>
            </div>
          )}

          {calendarData && !loading && !error && (
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {new Date(currentMonth + "-01").toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                    }
                  )}
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-muted-foreground h-8 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarData.days.map((day, idx) => {
                  const dayOfWeek = getDayOfWeek(day.date);
                  const isFirstDay = idx === 0;
                  const startOffset =
                    isFirstDay ? dayOfWeek : 0;

                  return (
                    <div key={day.date}>
                      {/* Render empty cells for days before month starts */}
                      {isFirstDay &&
                        Array.from({ length: startOffset }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="h-8 w-8 flex items-center justify-center"
                          />
                        ))}

                      {/* Day cell */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-8 w-8 flex items-center justify-center rounded text-xs font-medium border transition-colors cursor-default",
                              getDayActivityColor(day.totalEvents),
                              day.hasActivity &&
                                "border-green-400 dark:border-green-500"
                            )}
                          >
                            {formatDate(day.date)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="text-sm">
                            <p className="font-semibold">{day.date}</p>
                            {day.hasActivity ? (
                              <div className="mt-1 text-xs space-y-0.5">
                                <p>
                                  <strong>{day.totalEvents}</strong> activities
                                </p>
                                {day.types.review > 0 && (
                                  <p>
                                    {getActivityTypeEmoji("review")}{" "}
                                    {day.types.review} reviews
                                  </p>
                                )}
                                {day.types.reading_attempt > 0 && (
                                  <p>
                                    {getActivityTypeEmoji("reading_attempt")}{" "}
                                    {day.types.reading_attempt} reading
                                  </p>
                                )}
                                {day.types.writing_attempt > 0 && (
                                  <p>
                                    {getActivityTypeEmoji("writing_attempt")}{" "}
                                    {day.types.writing_attempt} writing
                                  </p>
                                )}
                                {day.types.cefr_learn > 0 && (
                                  <p>
                                    {getActivityTypeEmoji("cefr_learn")}{" "}
                                    {day.types.cefr_learn} learned
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-muted-foreground">
                                No activity
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>

              {/* Month Stats */}
              <div className="pt-3 border-t border-border text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {calendarData.monthStats.daysWithActivity} days with activity
                </p>
                <p className="text-xs">
                  {calendarData.monthStats.totalEvents} total events
                </p>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}

export default StreakCalendarPopover;
