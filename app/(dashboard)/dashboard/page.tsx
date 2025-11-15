"use client";

import dynamic from "next/dynamic";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useCollections } from "@/hooks/use-collections";
import { useUserStats } from "@/hooks/use-settings";
import { useDueCount } from "@/hooks/use-reviews";
import { useReadingPassages } from "@/hooks/use-reading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Layers,
  Plus,
  Candy as Cards,
  Flame,
  TrendingUp,
  Zap,
  Sparkles,
  GraduationCap,
  Award,
  Trophy,
  Calendar,
  BookOpenCheck,
  ArrowRight,
  FileText,
  Target,
  Brain,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { updateUserStreakAction } from "@/app/actions/settings";
import { WordStageCard } from "@/components/ui/word-stage-card";

// ✅ Lazy load modals - only load when needed
const AddWordModal = dynamic(
  () =>
    import("@/components/modals/add-word-modal").then((mod) => ({
      default: mod.AddWordModal,
    })),
  { ssr: false }
);

const CreateCollectionModal = dynamic(
  () =>
    import("@/components/modals/create-collection-modal").then((mod) => ({
      default: mod.CreateCollectionModal,
    })),
  { ssr: false }
);

export default function Dashboard() {
  // ✅ Parallel fetching - tất cả queries chạy đồng thời
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: dueCount = 0, isLoading: dueLoading } = useDueCount();
  const { data: readingPassages, isLoading: passagesLoading } =
    useReadingPassages();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Update streak on dashboard load
  useEffect(() => {
    updateUserStreakAction();
  }, []);

  const totalWords = stats?.totalWords || 0;
  const totalCollections = stats?.totalCollections || 0;
  const currentStreak = stats?.currentStreak || 0;

  const recentCollections = (collections || []).slice(0, 5);

  // ✅ Hiển thị từng phần khi data có sẵn (không chờ tất cả)
  const hasCollections = !!collections;
  const hasStats = !!stats;

  // Calculate passage-related metrics
  const passageMetrics = useMemo(() => {
    if (!readingPassages || !stats) {
      return {
        totalPassages: 0,
        completedPassages: 0,
        wordsInPassages: 0,
        wordsReadyForPassages: 0,
        completionRate: 0,
      };
    }

    const totalPassages = readingPassages.length;
    const completedPassages = readingPassages.filter(
      (p) => p._count && p._count.attempts > 0
    ).length;

    // Extract unique words used in passages
    const wordsInPassagesSet = new Set<string>();
    readingPassages.forEach((passage) => {
      passage.wordsUsed?.forEach((word) => wordsInPassagesSet.add(word));
    });

    const wordsInPassages = wordsInPassagesSet.size;

    // Words that are familiar/master are ideal for passages
    const wordsReadyForPassages =
      (stats.familiarWords || 0) + (stats.masterWords || 0);

    const completionRate =
      totalPassages > 0
        ? Math.round((completedPassages / totalPassages) * 100)
        : 0;

    return {
      totalPassages,
      completedPassages,
      wordsInPassages,
      wordsReadyForPassages,
      completionRate,
    };
  }, [readingPassages, stats]);

  return (
    <div className="p-4 md:p-8 min-h-screen bg-white dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-primary/5 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:opacity-[0.03] hidden dark:block">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Welcome Header with Streak */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              Learn Through Context 🎯
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Master vocabulary by creating and reading personalized passages
            </p>
          </div>

          {/* Daily Streak Badge - Compact */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border-2 border-orange-200/50 dark:border-orange-800/30 rounded-2xl px-6 py-3">
            <div className="relative">
              {currentStreak > 0 ? (
                <>
                  <div className="text-3xl">🔥</div>
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {currentStreak}
                  </div>
                </>
              ) : (
                <div className="text-3xl opacity-50">💤</div>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                {currentStreak > 0
                  ? `${currentStreak} Day Streak`
                  : "Start Today"}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentStreak > 0 ? "Keep going!" : "Begin your journey"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - PRIMARY CTA (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 🎯 HERO CARD: Create Reading Passage - PRIMARY CTA */}
            <div
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 p-8 md:p-10 shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl animate-in fade-in slide-in-from-bottom-4 group"
              style={{ animationDelay: "100ms" }}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

              {/* Floating emoji decorations */}
              <div className="absolute top-8 right-12 text-4xl animate-float opacity-80">
                📖
              </div>
              <div
                className="absolute top-20 right-32 text-3xl animate-float opacity-60"
                style={{ animationDelay: "1s" }}
              >
                ✨
              </div>
              <div
                className="absolute bottom-12 right-20 text-2xl animate-float opacity-70"
                style={{ animationDelay: "0.5s" }}
              >
                🎯
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Text Content */}
                <div className="flex-1 text-white space-y-4">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-2">
                    <Sparkles className="h-4 w-4" />
                    Your Learning Path
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    CREATE
                    <br />
                    READING PASSAGE
                  </h2>

                  <p className="text-white/90 text-base leading-relaxed">
                    {passageMetrics.wordsReadyForPassages > 0 ? (
                      <>
                        You have{" "}
                        <strong>{passageMetrics.wordsReadyForPassages}</strong>{" "}
                        {passageMetrics.wordsReadyForPassages === 1
                          ? "word"
                          : "words"}{" "}
                        ready to use in a new passage!
                      </>
                    ) : (
                      <>
                        Learn some words first, then create personalized reading
                        passages
                      </>
                    )}
                  </p>

                  {/* Mini Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-xl">
                      <FileText className="h-4 w-4" />
                      <span>
                        <strong>{passageMetrics.totalPassages}</strong> passages
                        created
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-xl">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        <strong>{passageMetrics.completedPassages}</strong>{" "}
                        completed
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 group-hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    asChild={
                      passageMetrics.wordsReadyForPassages >= 5 ||
                      totalWords >= 5
                    }
                    disabled={totalWords < 5}
                  >
                    {totalWords >= 5 ? (
                      <Link href="/reading" className="flex items-center gap-2">
                        CREATE NEW PASSAGE
                        <Rocket className="h-5 w-5" />
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2">
                        ADD 5 WORDS TO START
                        <Rocket className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </div>

                {/* Illustration - Dynamic character */}
                <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative animate-bounce-subtle">
                      <div className="text-[8rem] leading-none transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        📚
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contextual Learning Progress - Shows connection between vocab and passages */}
            {hasStats && (
              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      Vocabulary Mastery Journey
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {passageMetrics.wordsInPassages > 0 && (
                      <span className="text-primary font-semibold">
                        {passageMetrics.wordsInPassages} words used in passages
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <WordStageCard
                    title="New"
                    count={stats?.newWords || 0}
                    total={totalWords}
                    icon={Sparkles}
                    gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                    iconColor="bg-blue-500"
                    description="Just added • Learn these first"
                    onClick={() => {
                      console.log("Navigate to new words");
                    }}
                  />

                  <WordStageCard
                    title="Learning"
                    count={stats?.learningWords || 0}
                    total={totalWords}
                    icon={GraduationCap}
                    gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
                    iconColor="bg-yellow-500"
                    description="1-3 reviews • Keep practicing"
                    onClick={() => {
                      console.log("Navigate to learning words");
                    }}
                  />

                  <WordStageCard
                    title="Familiar"
                    count={stats?.familiarWords || 0}
                    total={totalWords}
                    icon={Award}
                    gradient="bg-gradient-to-br from-green-500 to-emerald-500"
                    iconColor="bg-green-500"
                    description="4-7 reviews • Ready for passages!"
                    onClick={() => {
                      console.log("Navigate to familiar words");
                    }}
                  />

                  <WordStageCard
                    title="Master"
                    count={stats?.masterWords || 0}
                    total={totalWords}
                    icon={Trophy}
                    gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                    iconColor="bg-purple-500"
                    description="8+ reviews • Perfect for passages!"
                    onClick={() => {
                      console.log("Navigate to master words");
                    }}
                  />
                </div>

                {/* Helper text connecting vocab to passages */}
                {/* <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span>
                      <strong className="text-foreground">Pro tip:</strong>{" "}
                      Words at "Familiar" or "Master" level work best in reading
                      passages. Use them to reinforce your learning!
                    </span>
                  </p>
                </div> */}
              </div>
            )}
          </div>

          {/* Right Column - Secondary Actions & Stats */}
          <div className="space-y-4">
            {/* Reading Passages Library */}
            <div
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-5 animate-in fade-in slide-in-from-right-4"
              style={{ animationDelay: "150ms" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-primary" />
                  Your Passages
                </h3>
                <Link href="/reading">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    View All
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Passage Stats Overview */}
              {!passagesLoading && passageMetrics.totalPassages > 0 && (
                <div className="mb-4 p-3 bg-white/50 dark:bg-white/5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Completion Rate
                    </span>
                    <span className="font-bold text-primary">
                      {passageMetrics.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-white/80 dark:bg-black/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${passageMetrics.completionRate}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {passagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : readingPassages && readingPassages.length > 0 ? (
                  readingPassages.slice(0, 3).map((passage, index) => (
                    <Link key={passage.id} href={`/reading/${passage.id}`}>
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all duration-200 cursor-pointer group border border-transparent hover:border-primary/20 hover:scale-[1.01]"
                        style={{ animationDelay: `${100 * index}ms` }}
                      >
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                          style={{
                            background: passage.collection?.color
                              ? `linear-gradient(135deg, ${passage.collection.color}40 0%, ${passage.collection.color}20 100%)`
                              : "linear-gradient(135deg, #8B5CF640 0%, #8B5CF620 100%)",
                          }}
                        >
                          <BookOpenCheck
                            className="h-5 w-5"
                            style={{
                              color: passage.collection?.color || "#8B5CF6",
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
                            {passage.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0 h-5"
                            >
                              {passage.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ~{passage.estimatedTime} min
                            </span>
                            {passage._count && passage._count.attempts > 0 && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  •
                                </span>
                                <span className="text-xs text-green-500 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Done
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpenCheck className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      No passages yet
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Create your first AI-powered reading passage
                    </p>
                    <Link href="/reading">
                      <Button size="sm" variant="default">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Create Passage
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary: Revision Card */}
            <div
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200/50 dark:border-purple-800/30 rounded-2xl p-5 animate-in fade-in slide-in-from-right-4"
              style={{ animationDelay: "250ms" }}
            >
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                QUICK REVISION
              </h3>

              <div className="space-y-3">
                <div className="text-center py-3">
                  {dueLoading ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                        {dueCount}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dueCount === 0
                          ? "All caught up! 🎉"
                          : `${dueCount === 1 ? "word" : "words"} to review`}
                      </p>
                    </>
                  )}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50"
                  size="sm"
                  asChild={dueCount > 0}
                  disabled={dueCount === 0}
                >
                  {dueCount > 0 ? (
                    <Link
                      href="/flashcards?mode=review"
                      className="flex items-center gap-2"
                    >
                      <Cards className="h-4 w-4" />
                      Start Flashcards
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Cards className="h-4 w-4" />
                      Start Flashcards
                    </span>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Reinforce words before using them in passages
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            {/* <div
              className="bg-card border-2 rounded-2xl p-5 animate-in fade-in slide-in-from-right-4"
              style={{ animationDelay: "300ms" }}
            >
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <AddWordModal
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl hover:border-primary/50 hover:bg-primary/5"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Word
                    </Button>
                  }
                />
                <Link href="/collections">
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl hover:border-primary/50 hover:bg-primary/5"
                    size="sm"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    View Collections
                  </Button>
                </Link>
              </div>
            </div> */}
          </div>
        </div>

        {/* Recent Collections - Full Width at Bottom */}
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "350ms" }}
        >
          <Card className="border-2 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Your Collections
              </CardTitle>
              <Link href="/collections">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl hover:bg-primary/10"
                >
                  View all →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {!hasCollections ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                      <div className="h-8 w-16 bg-muted animate-pulse rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : recentCollections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-4">
                    <Layers className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No collections yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first collection to organize vocabulary by
                    topics
                  </p>
                  <CreateCollectionModal />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentCollections.map((collection, index) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.id}`}
                    >
                      <div className="group flex items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-primary/30 bg-gradient-to-br from-card to-muted/20 hover:to-primary/5 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg">
                        <div
                          className={`h-12 w-12 rounded-xl shrink-0 flex items-center justify-center ${
                            collection.color || "bg-primary"
                          } shadow-md group-hover:scale-110 transition-transform`}
                        >
                          <Layers className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                            {collection.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />
                              {collection.wordCount || 0}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
