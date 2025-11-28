"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import type { Word } from "@/lib/types";
import { CheckCircle, X, RotateCcw } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";

interface QuizQuestion {
  word: Word;
  type: "multiple-choice" | "fill-blank";
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface QuizPlayerProps {
  words: Word[];
  mode: "multiple-choice" | "fill-blank";
  onComplete: (results: {
    score: number;
    total: number;
    questions: QuizQuestion[];
  }) => void;
  onExit: () => void;
}

export function QuizPlayer({
  words,
  mode,
  onComplete,
  onExit,
}: QuizPlayerProps) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    questions: QuizQuestion[];
  }>({
    score: 0,
    total: 0,
    questions: [],
  });
  const { updateWord } = useAppStore();

  useEffect(() => {
    generateQuestions();
  }, [words, mode]);

  const generateQuestions = () => {
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const generatedQuestions: QuizQuestion[] = shuffledWords
      .map((word): QuizQuestion | null => {
        if (mode === "multiple-choice") {
          // Generate distractors from other words
          const otherWords = words.filter((w) => w.id !== word.id);
          const distractors = otherWords
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((w) => w.definition);

          const options = [word.definition, ...distractors].sort(
            () => Math.random() - 0.5
          );

          return {
            word,
            type: "multiple-choice" as const,
            options,
            correctAnswer: word.definition,
          };
        } else {
          // Fill in the blank - only if example contains the term
          const example = word.example?.trim();

          // Check if example exists and contains the term (case-insensitive)
          if (!example) {
            return null; // Skip words without examples
          }

          const termRegex = new RegExp(`\\b${word.term}\\b`, "gi");
          const hasTermInExample = termRegex.test(example);

          if (!hasTermInExample) {
            return null; // Skip if term not found in example
          }

          return {
            word,
            type: "fill-blank" as const,
            correctAnswer: word.term,
          };
        }
      })
      .filter((q): q is QuizQuestion => q !== null); // Remove null questions

    setQuestions(generatedQuestions);
  };

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    const isCorrect =
      answer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();

    // Update question with user answer
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex] = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect,
    };
    setQuestions(updatedQuestions);

    // Update word score
    const newScore = (currentQuestion.word.score || 0) + (isCorrect ? 1 : -1);
    updateWord(currentQuestion.word.id, { score: Math.max(0, newScore) });

    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setUserAnswer("");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate final results
      const score = questions.filter((q) => q.isCorrect).length;
      setResults({
        score,
        total: questions.length,
        questions,
      });
      setShowSummary(true);
    }
  };

  const handleComplete = () => {
    onComplete(results);
    setShowSummary(false);
  };

  const renderQuestion = () => {
    if (mode === "multiple-choice") {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold break-all px-4">
                {currentQuestion.word.term}
              </h2>
              {currentQuestion.word.partOfSpeech && (
                <Badge variant="outline" className="text-sm shrink-0">
                  {currentQuestion.word.partOfSpeech}
                </Badge>
              )}
            </div>
            {currentQuestion.word.phonetic && (
              <p className="text-muted-foreground break-all px-4">
                {currentQuestion.word.phonetic}
              </p>
            )}
          </div>

          <p className="text-center text-lg mb-6">{t("quizPlayer.whatDoesWordMean")}</p>

          <div className="space-y-2">
            {currentQuestion.options?.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto p-4 bg-transparent break-all whitespace-normal"
                onClick={() => handleAnswer(option)}
                disabled={showFeedback}
              >
                <span className="mr-3 font-semibold shrink-0">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="break-all">{option}</span>
              </Button>
            ))}
          </div>
        </div>
      );
    } else {
      // Fill in the blank
      const sentence = currentQuestion.word.example || "";

      // Replace the term with blank using word boundary for exact match
      const termRegex = new RegExp(`\\b${currentQuestion.word.term}\\b`, "gi");
      const maskedSentence = sentence.replace(termRegex, "_____");

      return (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg mb-6">{t("quizPlayer.fillInBlankPrompt")}</p>
            <div className="text-xl font-medium p-4 bg-muted rounded-lg break-all whitespace-pre-wrap">
              {maskedSentence}
            </div>
          </div>

          <div className="space-y-4">
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={t("quizPlayer.typeYourAnswer")}
              disabled={showFeedback}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && userAnswer.trim() && !showFeedback) {
                  handleAnswer(userAnswer);
                }
              }}
            />

            {!showFeedback && (
              <Button
                onClick={() => handleAnswer(userAnswer)}
                disabled={!userAnswer.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
              >
                {t("quizPlayer.submitAnswer")}
              </Button>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-8 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
      {/* Content - positioned above background */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-6 py-8">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {t("quizPlayer.questionOf", { current: currentIndex + 1, total: questions.length })}
            </span>
            <span>{t("quizPlayer.complete", { percent: Math.round(progress) })}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("quizPlayer.quizQuestion")}</span>
              <Badge variant="secondary">
                {mode === "multiple-choice"
                  ? t("quizPlayer.multipleChoice")
                  : t("quizPlayer.fillInBlank")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderQuestion()}

            {/* Feedback */}
            {showFeedback && (
              <div
                className={`p-4 rounded-lg border ${
                  currentQuestion.isCorrect
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {currentQuestion.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {currentQuestion.isCorrect ? t("quizPlayer.correct") : t("quizPlayer.incorrect")}
                  </span>
                </div>

                {!currentQuestion.isCorrect && (
                  <p className="text-sm break-all">
                    {t("quizPlayer.correctAnswerIs")}{" "}
                    <strong className="break-all">
                      {currentQuestion.correctAnswer}
                    </strong>
                  </p>
                )}

                <div className="mt-3">
                  <p className="text-sm font-medium">{t("quizPlayer.definition")}</p>
                  <p className="text-sm text-muted-foreground break-all">
                    {currentQuestion.word.definition}
                  </p>
                </div>

                <Button onClick={handleNext} className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                  {currentIndex < questions.length - 1
                    ? t("quizPlayer.nextQuestion")
                    : t("quizPlayer.finishQuiz")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exit button */}
        <div className="text-center">
          <Button variant="ghost" onClick={onExit} className="bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full">
            {t("quizPlayer.exitQuiz")}
          </Button>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("quizPlayer.quizComplete")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">
                {Math.round((results.score / results.total) * 100)}%
              </div>
              <p className="text-muted-foreground">
                {t("quizPlayer.outOfCorrect", { score: results.score, total: results.total })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-semibold text-green-500">
                  {results.score}
                </div>
                <p className="text-xs text-muted-foreground">{t("quizPlayer.correctLabel")}</p>
              </div>
              <div>
                <div className="text-xl font-semibold text-red-500">
                  {results.total - results.score}
                </div>
                <p className="text-xs text-muted-foreground">{t("quizPlayer.incorrectLabel")}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onExit}
                className="flex-1 bg-transparent"
              >
                {t("quizPlayer.done")}
              </Button>
              <Button
                onClick={() => {
                  generateQuestions();
                  setCurrentIndex(0);
                  setShowSummary(false);
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("quizPlayer.retry")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
