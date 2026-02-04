"use client";

import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useCollections } from "@/hooks/use-collections";
import { useUserStats } from "@/hooks/use-settings";
import { useDueCount } from "@/hooks/use-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Plus,
  Candy as Cards,
  Flame,
  Zap,
  Sparkles,
  GraduationCap,
  ArrowRight,
  FileText,
  Dumbbell,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { updateUserStreakAction } from "@/app/actions/settings";
import { useTranslation } from "@/lib/i18n-provider";

export default function Dashboard() {
  const { t } = useTranslation();
  // ✅ Parallel fetching - all queries run simultaneously
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: dueCount = 0, isLoading: dueLoading } = useDueCount();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Update streak on dashboard load
  useEffect(() => {
    updateUserStreakAction();
  }, []);

  const totalWords = stats?.totalWords || 0;
  const currentStreak = stats?.currentStreak || 0;

  // Get last 7 days for streak calendar
  const streakDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({
        day: dayNames[date.getDay()],
        date: date.getDate(),
        isToday: i === 0,
        hasActivity: i === 0 || (currentStreak > i), // Show flame for streak days
      });
    }
    return days;
  }, [currentStreak]);

  // CEFR vocabulary sets
  const cefrLevels = [
    { level: "A1", name: "Beginner", color: "bg-green-500", words: 500 },
    { level: "A2", name: "Elementary", color: "bg-lime-500", words: 1000 },
    { level: "B1", name: "Intermediate", color: "bg-yellow-500", words: 2000 },
    { level: "B2", name: "Upper-Intermediate", color: "bg-orange-500", words: 4000 },
    { level: "C1", name: "Advanced", color: "bg-red-500", words: 8000 },
    { level: "C2", name: "Proficiency", color: "bg-purple-500", words: 16000 },
  ];

  return (
    <div className="p-4 md:p-8 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* ROW 1: Progress + Streak + Quick Review */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Progress Card - Contains 4 word stages */}
          <Card className="border-2 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200/50 dark:border-blue-800/30 animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {t("dashboard.progress")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
                  <div className="text-2xl font-bold text-green-500">{stats?.newWords || 0}</div>
                  <div className="text-xs text-muted-foreground">{t("dashboard.new")}</div>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
                  <div className="text-2xl font-bold text-yellow-500">{stats?.learningWords || 0}</div>
                  <div className="text-xs text-muted-foreground">{t("dashboard.learning")}</div>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
                  <div className="text-2xl font-bold text-orange-500">{stats?.familiarWords || 0}</div>
                  <div className="text-xs text-muted-foreground">{t("dashboard.familiar")}</div>
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
                  <div className="text-2xl font-bold text-purple-500">{stats?.masterWords || 0}</div>
                  <div className="text-xs text-muted-foreground">{t("dashboard.master")}</div>
                </div>
              </div>
              <div className="mt-3 text-center text-sm text-muted-foreground">
                {t("dashboard.totalWords")}: <span className="font-semibold text-foreground">{totalWords}</span>
              </div>
            </CardContent>
          </Card>

          {/* Streak Calendar Card */}
          <Card className="border-2 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200/50 dark:border-orange-800/30 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "100ms" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                {t("dashboard.streakCalendar")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-center gap-2 mb-3">
                {streakDays.map((day, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground mb-1">
                      {t(`dashboard.${day.day}`)}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        day.isToday
                          ? "ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900"
                          : ""
                      } ${
                        day.hasActivity
                          ? "bg-gradient-to-br from-orange-400 to-red-500"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      {day.hasActivity ? (
                        <Flame className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-xs text-gray-500">{day.date}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-500">{currentStreak}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {t("dashboard.dayStreak", { count: currentStreak })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Review Card */}
          <Card className="border-2 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/30 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "200ms" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                {t("dashboard.quickRevision")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-2">
                {dueLoading ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                      {dueCount}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dueCount === 0
                        ? t("dashboard.allCaughtUp")
                        : t("dashboard.wordsToReview", { count: dueCount })}
                    </p>
                  </>
                )}
              </div>
              <Button
                className="w-full mt-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50"
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
            </CardContent>
          </Card>
        </div>

        {/* ROW 2: Quick Access */}
        <Card className="border-2 rounded-2xl bg-card animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "300ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("dashboard.quickAccess")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Add Word - Navigate to collections with modal open */}
              <Link href="/collections?addWord=true">
                <Button
                  variant="outline"
                  className="h-20 w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{t("dashboard.addWord")}</span>
                </Button>
              </Link>

              {/* Practice */}
              <Link href="/flashcards">
                <Button
                  variant="outline"
                  className="h-20 w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Dumbbell className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="text-sm font-medium">{t("dashboard.practiceNow")}</span>
                </Button>
              </Link>

              {/* Reading Practice */}
              <Link href="/reading">
                <Button
                  variant="outline"
                  className="h-20 w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium">{t("dashboard.readingPractice")}</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ROW 3: Vocabulary Sets (CEFR Levels) */}
        <Card className="border-2 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-200/50 dark:border-teal-800/30 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "400ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-teal-600" />
              {t("dashboard.vocabularySets")}
            </CardTitle>
            <Link href="/vocabulary">
              <Button variant="ghost" size="sm" className="rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/30">
                {t("dashboard.viewVocabulary")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {cefrLevels.map((level) => (
                <Link key={level.level} href={`/vocabulary?level=${level.level}`}>
                  <div className="group bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer text-center">
                    <div className={`w-12 h-12 rounded-full ${level.color} mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform`}>
                      {level.level}
                    </div>
                    <div className="text-sm font-semibold text-foreground">{level.name}</div>
                    <div className="text-xs text-muted-foreground">{level.words.toLocaleString()} {t("dashboard.words")}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
