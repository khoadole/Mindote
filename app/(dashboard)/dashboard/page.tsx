"use client";

import dynamic from "next/dynamic";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useCollections } from "@/hooks/use-collections";
import { useUserStats } from "@/hooks/use-settings";
import { useDueCount } from "@/hooks/use-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { GradientCard } from "@/components/ui/gradient-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Layers,
  Plus,
  Candy as Cards,
  CheckCircle,
  Loader2,
  Flame,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";

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

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const totalWords = stats?.totalWords || 0;
  const totalCollections = stats?.totalCollections || 0;

  const recentCollections = (collections || []).slice(0, 5);

  // ✅ Hiển thị từng phần khi data có sẵn (không chờ tất cả)
  const hasCollections = !!collections;
  const hasStats = !!stats;

  return (
    <div className="p-8 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Your Learning Journey
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your progress and keep learning every day 🚀
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Show immediately */}
        <div
          className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-500"
          style={{ animationDelay: "100ms" }}
        >
          <AddWordModal
            trigger={
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 shadow-sm"
                data-shortcut="add-word"
              >
                <Plus className="h-4 w-4" />
                Add Word
              </Button>
            }
          />
          <CreateCollectionModal />
          <Link href="/flashcards">
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-2xl border-2 hover:border-accent hover:bg-accent/5 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <Cards className="h-4 w-4" />
              Start Flashcards
            </Button>
          </Link>
          <Link href="/quiz">
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-2xl border-2 hover:border-success hover:bg-success/5 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Start Quiz
            </Button>
          </Link>
        </div>

        {/* Stats Cards - Progressive rendering */}
        {!hasStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="content-rounded">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Words"
              value={totalWords}
              description="Keep building your vocabulary"
              icon={BookOpen}
              iconColor="text-primary"
              gradientClass="gradient-purple"
              delay={200}
              trend={{
                value: 12,
                label: "from last week",
                isPositive: true,
              }}
            />

            <StatCard
              title="Collections"
              value={totalCollections}
              description="Organized learning topics"
              icon={Layers}
              iconColor="text-blue-500"
              gradientClass="gradient-green"
              delay={300}
            />

            <div
              className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDelay: "400ms" }}
            >
              <GradientCard gradient="orange">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                    Due Today
                  </CardTitle>
                  <Badge variant="secondary" className="animate-bounce-in">
                    Active
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl font-bold text-gradient-purple">
                      {dueCount}
                    </div>
                    <ProgressRing
                      progress={
                        totalWords > 0
                          ? Math.min((dueCount / totalWords) * 100, 100)
                          : 0
                      }
                      size={60}
                      strokeWidth={5}
                      color="oklch(0.75 0.18 65)"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Words ready for review
                  </p>
                  {dueCount > 0 && (
                    <Link href="/flashcards?mode=review">
                      <Button
                        size="sm"
                        className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Study Now
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </GradientCard>
            </div>
          </div>
        )}

        {/* Recent Collections - Progressive rendering */}
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "500ms" }}
        >
          <GradientCard gradient="purple" hoverable={false}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary" />
                Recent Collections
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
            <CardContent>
              {!hasCollections ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-2xl border bg-card/50"
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
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center mb-6 animate-float">
                    <Layers className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No collections yet
                  </h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Collections help you organize your vocabulary by topics.
                    Create your first collection to start adding words!
                  </p>
                  <CreateCollectionModal />
                  <div className="mt-6 p-4 bg-primary/5 rounded-2xl max-w-md mx-auto">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Tip:</strong> You need to create a collection
                      before adding words
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCollections.map((collection, index) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.id}`}
                    >
                      <div
                        className="group flex items-center justify-between p-5 rounded-2xl border-2 border-transparent hover:border-primary/50 bg-card/50 hover:bg-card transition-all duration-300 gap-3 cursor-pointer hover:scale-[1.02] animate-in fade-in slide-in-from-left-4 fill-mode-both"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animationDuration: "500ms",
                        }}
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div
                            className={`h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center ${
                              collection.color || "bg-primary"
                            } shadow-lg group-hover:scale-110 transition-transform`}
                          >
                            <Layers className="h-6 w-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                              {collection.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {collection.wordCount || 0} words
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          Study →
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </GradientCard>
        </div>
      </div>
    </div>
  );
}
