"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import type { Word } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Zap,
  ThumbsUp,
} from "lucide-react";
import { submitBatchReviews } from "@/app/actions/review-batch";
import {
  calculateNextReview,
  type ReviewQuality,
  type ReviewResult,
} from "@/lib/srs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useTranslation } from "@/lib/i18n-provider";

interface FlashcardPlayerProps {
  words: Word[];
  onComplete: (results: { correct: number; again: number }) => void;
  onExit: () => void;
}

export function FlashcardPlayer({
  words,
  onComplete,
  onExit,
}: FlashcardPlayerProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<{ correct: number; again: number }>({
    correct: 0,
    again: 0,
  });
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]); // Store all reviews
  const [showSummary, setShowSummary] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { updateWord } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { speak, isSpeaking, stop } = useTextToSpeech({
    lang: "en-US",
    rate: 0.9,
  });
  const hasShuffledRef = useRef(false);

  useEffect(() => {
    // Only shuffle words once on mount, not on every re-render
    if (!hasShuffledRef.current && words.length > 0) {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffled);
      hasShuffledRef.current = true;
    }
  }, [words]);

  if (shuffledWords.length === 0) return null;

  const currentWord = shuffledWords[currentIndex];
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100;

  const handleNext = () => {
    setIsFlipped(false);
    stop(); // Stop speaking when moving to next card
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    stop(); // Stop speaking when moving to previous card
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnswer = async (quality: 0 | 3 | 5) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Stop speaking when answering
    stop();

    try {
      // Calculate SRS data locally (don't save to DB yet)
      const srsData = calculateNextReview(quality, {
        easeFactor: currentWord.easeFactor,
        interval: currentWord.interval,
        repetitions: currentWord.repetitions,
        lastReviewed: currentWord.lastReviewed
          ? new Date(currentWord.lastReviewed)
          : undefined,
        nextReview: currentWord.nextReview
          ? new Date(currentWord.nextReview)
          : undefined,
      });

      // Store review result for batch update later
      const reviewResult: ReviewResult = {
        wordId: currentWord.id,
        quality,
        srsData,
      };

      setReviewResults((prev) => [...prev, reviewResult]);

      // Update results
      const newResults = {
        correct: results.correct + (quality > 0 ? 1 : 0),
        again: results.again + (quality === 0 ? 1 : 0),
      };
      setResults(newResults);

      // Show quick feedback (no need to wait for DB)
      const feedbackMessages = {
        0: t("flashcardPlayer.feedbackAgain"),
        3: t("flashcardPlayer.feedbackGood"),
        5: t("flashcardPlayer.feedbackEasy"),
      };

      toast({
        title: feedbackMessages[quality],
        duration: 1500,
      });

      handleNext();
    } catch (error) {
      console.error("Error processing review:", error);
      toast({
        title: t("flashcardPlayer.errorTitle"),
        description: t("flashcardPlayer.errorProcessingReview"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    // Save all reviews to database in one batch
    setIsSaving(true);

    // Optimistic update - update UI immediately
    const againCount = reviewResults.filter((r) => r.quality === 0).length;
    const goodCount = reviewResults.filter((r) => r.quality > 0).length;

    // Update cache optimistically before API call
    queryClient.setQueryData(["dueCount"], (oldCount: number = 0) => {
      // Subtract good words, add back "again" words
      return Math.max(0, oldCount - goodCount + againCount);
    });

    try {
      const result = await submitBatchReviews(reviewResults);

      if (!result.success) {
        // Rollback optimistic update on error
        queryClient.invalidateQueries({ queryKey: ["dueCount"] });

        toast({
          title: t("flashcardPlayer.errorTitle"),
          description: t("flashcardPlayer.errorSavingProgress"),
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Invalidate queries to get fresh data from server
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dueWords"] }),
        queryClient.invalidateQueries({ queryKey: ["dueCount"] }),
        queryClient.invalidateQueries({ queryKey: ["words"] }),
        queryClient.invalidateQueries({ queryKey: ["user-stats"] }), // Update word stages
      ]);

      toast({
        title: t("flashcardPlayer.progressSaved"),
        description: t("flashcardPlayer.wordsUpdated", { count: reviewResults.length }),
      });

      onComplete(results);
      setShowSummary(false);
    } catch (error) {
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["dueCount"] });

      console.error("Error saving reviews:", error);
      toast({
        title: t("flashcardPlayer.errorTitle"),
        description: t("flashcardPlayer.errorSavingProgressDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = async () => {
    // Save and exit
    setIsSaving(true);

    if (reviewResults.length > 0) {
      // Optimistic update - update UI immediately
      const againCount = reviewResults.filter((r) => r.quality === 0).length;
      const goodCount = reviewResults.filter((r) => r.quality > 0).length;

      // Update cache optimistically before API call
      queryClient.setQueryData(["dueCount"], (oldCount: number = 0) => {
        // Subtract good words, add back "again" words
        return Math.max(0, oldCount - goodCount + againCount);
      });
    }

    try {
      if (reviewResults.length > 0) {
        const result = await submitBatchReviews(reviewResults);

        if (!result.success) {
          // Rollback optimistic update on error
          queryClient.invalidateQueries({ queryKey: ["dueCount"] });

          toast({
            title: t("flashcardPlayer.errorTitle"),
            description: t("flashcardPlayer.errorSavingProgress"),
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        // Invalidate queries to get fresh data from server
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["dueWords"] }),
          queryClient.invalidateQueries({ queryKey: ["dueCount"] }),
          queryClient.invalidateQueries({ queryKey: ["words"] }),
          queryClient.invalidateQueries({ queryKey: ["user-stats"] }), // Update word stages
        ]);

        toast({
          title: t("flashcardPlayer.progressSaved"),
          description: t("flashcardPlayer.wordsUpdated", { count: reviewResults.length }),
        });
      }

      // Call onComplete to trigger navigation
      onComplete(results);
      setShowSummary(false);
    } catch (error) {
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["dueCount"] });

      console.error("Error saving reviews:", error);
      toast({
        title: t("flashcardPlayer.errorTitle"),
        description: t("flashcardPlayer.errorSavingProgressDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-full flex items-center justify-center bg-white dark:bg-background py-8">
      <div className="p-8 w-full max-w-2xl space-y-6 relative z-10">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {t("flashcardPlayer.cardOf", { current: currentIndex + 1, total: shuffledWords.length })}
            </span>
            <span>{t("flashcardPlayer.complete", { percent: Math.round(progress) })}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <div className="relative">
          <Card
            className="min-h-[400px] cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <CardContent className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
              {!isFlipped ? (
                // Front of card
                <div className="space-y-4 w-full">
                  <Badge variant="secondary" className="mb-4">
                    {t("flashcardPlayer.term")}
                  </Badge>
                  <h2 className="text-4xl font-bold mb-4 break-words px-4">
                    {currentWord.term}
                  </h2>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {currentWord.phonetic && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-muted-foreground break-words">
                          {currentWord.phonetic}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSpeaking) {
                              stop();
                            } else {
                              speak(currentWord.term);
                            }
                          }}
                          title={isSpeaking ? t("flashcardPlayer.stopSpeaking") : t("flashcardPlayer.speakWord")}
                        >
                          {isSpeaking ? (
                            <VolumeX className="h-4 w-4 text-primary animate-pulse" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    {currentWord.partOfSpeech && (
                      <Badge variant="outline" className="text-sm">
                        {currentWord.partOfSpeech}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-8">
                    {t("flashcardPlayer.clickToReveal")}
                  </p>
                </div>
              ) : (
                // Back of card
                <div className="space-y-4 w-full">
                  <Badge variant="secondary" className="mb-4">
                    {t("flashcardPlayer.definition")}
                  </Badge>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-2xl font-semibold break-words px-4">
                      {currentWord.term}
                    </h3>
                    {currentWord.partOfSpeech && (
                      <Badge variant="outline" className="text-sm shrink-0">
                        {currentWord.partOfSpeech}
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg mb-4 break-words px-4">
                    {currentWord.definition}
                  </p>
                  {currentWord.example && (
                    <div className="border-t pt-4 w-full">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("flashcardPlayer.example")}
                      </p>
                      <p className="italic break-words px-4">
                        "{currentWord.example}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flip indicator */}
          <div className="absolute top-4 right-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("flashcardPlayer.previous")}
          </Button>

          {isFlipped && (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => handleAnswer(0)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                {t("flashcardPlayer.again")}
                <span className="text-xs opacity-70">{t("flashcardPlayer.now")}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAnswer(3)}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                <ThumbsUp className="h-4 w-4" />
                {t("flashcardPlayer.good")}
                <span className="text-xs opacity-70">{t("flashcardPlayer.oneToDays")}</span>
              </Button>
              <Button
                onClick={() => handleAnswer(5)}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Zap className="h-4 w-4" />
                {t("flashcardPlayer.easy")}
                <span className="text-xs opacity-70">{t("flashcardPlayer.plusThirtyPercent")}</span>
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleNext}
            className="hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
            disabled={currentIndex === shuffledWords.length - 1 && !isFlipped}
          >
            {t("flashcardPlayer.next")}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Exit button */}
        <div className="text-center">
          <Button variant="ghost" onClick={onExit} className="hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
            {t("flashcardPlayer.exitStudySession")}
          </Button>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Study Session Complete!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">
                {results.correct}
              </div>
              <p className="text-sm text-muted-foreground">
                Words you got right
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-semibold text-green-500">
                  {results.correct}
                </div>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div>
                <div className="text-xl font-semibold text-orange-500">
                  {results.again}
                </div>
                <p className="text-xs text-muted-foreground">Need Review</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleDone}
                className="flex-1 bg-transparent"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Done"}
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Study Again"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
