"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useAllWords } from "@/hooks/use-words";
import { useCollections, useCollection } from "@/hooks/use-collections";
import { useDueWords, useDueWordsByCollection } from "@/hooks/use-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Candy as Cards, Play, ArrowLeft, Loader2, Flame } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";

// ✅ Lazy load FlashcardPlayer - only load when user starts studying
const FlashcardPlayer = dynamic(
  () =>
    import("@/components/flashcard-player").then((mod) => ({
      default: mod.FlashcardPlayer,
    })),
  {
    ssr: false,
    loading: () => {
      const { t } = useTranslation();
      return (
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{t("flashcards.loadingFlashcardPlayer")}</span>
          </div>
        </div>
      );
    },
  }
);

export default function FlashcardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // 'review' or null (all words)
  const collectionParam = searchParams.get("collection"); // specific collection ID

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const { t } = useTranslation();
  const { data: words = [], isLoading: wordsLoading } = useAllWords();
  const { data: collections = [], isLoading: collectionsLoading } =
    useCollections();
  const { data: specificCollection } = useCollection(collectionParam || "");
  const { data: dueWords = [], isLoading: dueLoading } = useDueWords();
  const { data: collectionDueWords = [] } =
    useDueWordsByCollection(collectionParam);
  const { toast } = useToast();

  const [selectedScope, setSelectedScope] = useState<string>(
    collectionParam || "all"
  );
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [isStudying, setIsStudying] = useState(false);

  const isLoading =
    wordsLoading || collectionsLoading || (mode === "review" && dueLoading);

  // Set scope based on URL params
  useEffect(() => {
    if (collectionParam) {
      setSelectedScope(collectionParam);
    }
  }, [collectionParam]);

  // Auto-start if mode=review
  useEffect(() => {
    if (mode === "review" && dueWords.length > 0 && !isStudying) {
      setIsStudying(true);
    }
  }, [mode, dueWords, isStudying]);

  const getStudyWords = () => {
    // Review mode - only due words
    if (mode === "review") {
      // If specific collection, get due words for that collection
      if (collectionParam) {
        return collectionDueWords;
      }
      // Otherwise get all due words
      return dueWords;
    }

    // Normal mode - filter by scope
    if (!words) return [];
    if (selectedScope === "all") {
      return words;
    }
    return words.filter((word) => word.collectionId === selectedScope);
  };

  const studyWords = getStudyWords();

  const handleStartStudy = () => {
    if (studyWords.length === 0) {
      toast({
        title: t("flashcards.noWordsToStudy"),
        description: t("flashcards.addWordsOrSelectCollection"),
        variant: "destructive",
      });
      return;
    }
    setIsStudying(true);
  };

  const handleStudyComplete = (results: { correct: number; again: number }) => {
    toast({
      title: t("flashcards.sessionComplete"),
      description: t("flashcards.sessionResults", { correct: results.correct, again: results.again }),
    });

    // If in review mode, go back to dashboard or collection
    if (mode === "review") {
      if (collectionParam) {
        router.push(`/collections/${collectionParam}`);
      } else {
        router.push("/dashboard");
      }
    } else {
      setIsStudying(false);
    }
  };

  const handleExit = () => {
    // If in review mode, go back to dashboard or collection
    if (mode === "review") {
      if (collectionParam) {
        router.push(`/collections/${collectionParam}`);
      } else {
        router.push("/dashboard");
      }
    } else {
      setIsStudying(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
        <div className="flex items-center gap-2 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("flashcards.loadingFlashcards")}</span>
        </div>
      </div>
    );
  }

  if (isStudying) {
    return (
      <div className="p-6">
        <FlashcardPlayer
          words={studyWords as any}
          onComplete={handleStudyComplete}
          onExit={handleExit}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Minimal gradient background - Light mode only */}
      {/* <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" /> */}
      <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />

      {/* Subtle floating shapes - Light mode only */}
      {/* <div className="absolute inset-0 pointer-events-none dark:hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
        radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
        radial-gradient(at 50% 0%, rgba(236, 72, 153, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(251, 146, 60, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.15) 0px, transparent 50%)
      `,
          }}
        />

        <div
          className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-blue-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "7s", animationDelay: "1s" }}
        />
      </div> */}
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-pink-200/20 dark:from-primary dark:to-primary rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-blue-200/20 dark:from-accent dark:to-accent rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content - positioned above background */}
      <div className="relative z-10 p-6 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (collectionParam) {
                  router.push(`/collections/${collectionParam}`);
                } else {
                  router.push("/dashboard");
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <div className="flex items-center gap-2">
              {mode === "review" ? (
                <>
                  <Flame className="h-6 w-6 text-orange-500" />
                  <h1 className="text-3xl font-bold">
                    {collectionParam && specificCollection
                      ? `${t("flashcards.startReview")}: ${specificCollection.name}`
                      : t("flashcards.reviewSession")}
                  </h1>
                  <span className="text-sm text-muted-foreground">
                    ({(collectionParam ? collectionDueWords : dueWords).length}{" "}
                    {t("flashcards.dueWords")})
                  </span>
                </>
              ) : (
                <>
                  <Cards className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold">
                    {collectionParam && specificCollection
                      ? `${t("flashcards.title")}: ${specificCollection.name}`
                      : t("flashcards.title")}
                  </h1>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings */}
            <div
              className="lg:col-span-1 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
              style={{ animationDelay: "100ms" }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>
                    {mode === "review" ? t("flashcards.reviewSettings") : t("flashcards.studySettings")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode !== "review" && !collectionParam && (
                    <div className="space-y-2">
                      <Label htmlFor="scope">{t("flashcards.studyScope")}</Label>
                      <Select
                        value={selectedScope}
                        onValueChange={setSelectedScope}
                      >
                        <SelectTrigger className="truncate">
                          <SelectValue placeholder={t("flashcards.selectScope")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("flashcards.allWords")} ({words?.length || 0})
                          </SelectItem>
                          {collections?.map((collection) => (
                            <SelectItem
                              key={collection.id}
                              value={collection.id}
                              className="truncate"
                            >
                              <span
                                className="truncate block"
                                title={collection.name}
                              >
                                {collection.name} (
                                {words?.filter(
                                  (w) => w.collectionId === collection.id
                                ).length || 0}
                                )
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shuffle"
                      checked={shuffleEnabled}
                      onCheckedChange={setShuffleEnabled}
                    />
                    <Label htmlFor="shuffle">{t("flashcards.shuffleCards")}</Label>
                  </div>

                  <Button
                    onClick={handleStartStudy}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 dark:from-primary dark:to-accent text-white font-bold hover:from-purple-600 hover:to-pink-600 dark:hover:from-primary-dark dark:hover:to-accent transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                    disabled={studyWords.length === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {mode === "review" ? t("flashcards.startReview") : t("flashcards.startStudySession")}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div
              className="lg:col-span-2 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
              style={{ animationDelay: "200ms" }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{t("flashcards.preview")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {studyWords.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
                        <Cards className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          {t("flashcards.readyToStudy")}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {t("flashcards.cardsReady", { count: studyWords.length })}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {studyWords.slice(0, 5).map((word) => (
                            <span
                              key={word.id}
                              className="px-2 py-1 bg-muted rounded text-sm truncate max-w-[150px]"
                              title={word.term}
                            >
                              {word.term}
                            </span>
                          ))}
                          {studyWords.length > 5 && (
                            <span className="px-2 py-1 bg-muted rounded text-sm">
                              +{studyWords.length - 5} {t("flashcards.more")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {studyWords.length}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("flashcards.totalCards")}
                          </p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-accent">
                            {Math.ceil(studyWords.length * 2.5)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("flashcards.estMinutes")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Cards className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        {t("flashcards.noWordsAvailable")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {selectedScope === "all"
                          ? t("flashcards.addWordsToStart")
                          : t("flashcards.collectionNoWords")}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/collections")}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-transparent dark:to-transparent border-transparent dark:border-border text-white dark:text-foreground font-semibold hover:from-blue-600 hover:to-cyan-600 dark:hover:border-primary dark:hover:bg-primary/5 transition-all hover:scale-105 shadow-lg dark:shadow-sm"
                      >
                        {t("flashcards.goToCollections")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
