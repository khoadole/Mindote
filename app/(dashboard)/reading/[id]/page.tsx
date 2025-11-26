"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useReadingPassage, useSubmitAttempt } from "@/hooks/use-reading";
import { getDifficultyFromCefr } from "@/lib/difficulty-levels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";

export default function ReadingPassageViewer() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const passageId = params?.id as string;

  const { data: passage, isLoading, error } = useReadingPassage(passageId);
  const submitMutation = useSubmitAttempt();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);

  useEffect(() => {
    if (!passage) return;

    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, [passage]);

  // Show loading while fetching passages
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("reading.loadingPassage")}</p>
        </div>
      </div>
    );
  }

  // Show error if passage not found after loading
  if (!passage) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">{t("reading.passageNotFound")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("reading.passageNotFoundDesc")}
          </p>
          <Button onClick={() => router.push("/reading")}>
            {t("reading.backToReading")}
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    submitMutation.mutate(
      {
        passageId: passage.id,
        answers,
        timeSpent,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      }
    );
  };

  // Highlight learned words in passage
  const renderContent = () => {
    const content = passage.content;
    const vocabWords = passage.wordsUsed.map((w) => w.toLowerCase().trim());

    // Check if content contains CJK characters (Chinese, Japanese, Korean)
    const hasCJK =
      /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(content);

    if (hasCJK) {
      // For CJK languages, we need to search for vocabulary words as substrings
      // since words are not separated by spaces
      let result: JSX.Element[] = [];
      let lastIndex = 0;
      let keyCounter = 0;

      // Create a map to track which positions are already highlighted
      const highlightedRanges: Array<[number, number]> = [];

      // Sort vocab words by length (longest first) to avoid partial matches
      const sortedVocab = [...vocabWords].sort((a, b) => b.length - a.length);

      // Find all occurrences of vocabulary words
      sortedVocab.forEach((vocabWord) => {
        if (!vocabWord) return;

        let searchIndex = 0;
        while (true) {
          const index = content.toLowerCase().indexOf(vocabWord, searchIndex);
          if (index === -1) break;

          // Check if this range overlaps with existing highlights
          const overlaps = highlightedRanges.some(
            ([start, end]) =>
              (index >= start && index < end) ||
              (index + vocabWord.length > start &&
                index + vocabWord.length <= end)
          );

          if (!overlaps) {
            highlightedRanges.push([index, index + vocabWord.length]);
          }

          searchIndex = index + 1;
        }
      });

      // Sort ranges by start position
      highlightedRanges.sort((a, b) => a[0] - b[0]);

      // Build the result with highlighted sections
      highlightedRanges.forEach(([start, end]) => {
        // Add non-highlighted text before this range
        if (start > lastIndex) {
          result.push(
            <span key={keyCounter++}>
              {content.substring(lastIndex, start)}
            </span>
          );
        }

        // Add highlighted text
        const highlightedText = content.substring(start, end);
        result.push(
          <span
            key={keyCounter++}
            className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-800 transition-colors"
            onClick={() => setHighlightedWord(highlightedText)}
            title={t("reading.clickToSeeDefinition")}
          >
            {highlightedText}
          </span>
        );

        lastIndex = end;
      });

      // Add remaining text
      if (lastIndex < content.length) {
        result.push(
          <span key={keyCounter++}>{content.substring(lastIndex)}</span>
        );
      }

      return result;
    }

    // For space-separated languages (English, Spanish, etc.)
    const words = content.split(/(\s+)/);

    return words.map((word, idx) => {
      // Clean word for comparison
      const cleanWord = word
        .toLowerCase()
        .replace(/[.,!?;:"""''()[\]{}\/\\]/g, "")
        .trim();

      if (!cleanWord) {
        return <span key={idx}>{word}</span>;
      }

      // Check if this word matches vocabulary
      const isLearned = vocabWords.some((vocabWord) => {
        // Exact match
        if (cleanWord === vocabWord) return true;

        // Handle plurals and verb forms (English only)
        if (
          cleanWord === vocabWord + "s" ||
          cleanWord === vocabWord + "es" ||
          cleanWord === vocabWord + "d" ||
          cleanWord === vocabWord + "ed" ||
          cleanWord === vocabWord + "ing"
        ) {
          return true;
        }

        // Reverse check
        if (
          vocabWord === cleanWord + "s" ||
          vocabWord === cleanWord + "es" ||
          vocabWord === cleanWord + "d" ||
          vocabWord === cleanWord + "ed" ||
          vocabWord === cleanWord + "ing"
        ) {
          return true;
        }

        // For multi-word vocabulary terms
        if (vocabWord.includes(" ")) {
          const vocabWordsList = vocabWord.split(/\s+/);
          return vocabWordsList.includes(cleanWord);
        }

        return false;
      });

      return (
        <span
          key={idx}
          className={
            isLearned
              ? "bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-800 transition-colors"
              : ""
          }
          onClick={() => isLearned && setHighlightedWord(cleanWord)}
          title={isLearned ? t("reading.clickToSeeDefinition") : ""}
        >
          {word}
        </span>
      );
    });
  };

  const correctAnswers = passage.questions.filter(
    (q, idx) => answers[idx] === q.correctAnswer
  ).length;

  const allAnswered = Object.keys(answers).length === passage.questions.length;

  return (
    <div className="relative min-h-screen">
      {/* Minimal gradient background - Light mode only */}
      <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />

      {/* Subtle floating shapes - Light mode only */}
      <div className="absolute inset-0 pointer-events-none dark:hidden overflow-hidden opacity-40">
        <div className="absolute top-[10%] right-[15%] w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-2xl animate-float" />
        <div
          className="absolute bottom-[15%] left-[10%] w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-[50%] left-[50%] w-72 h-72 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content - positioned above background */}
      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/reading")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("reading.backToReading")}
            </Button>
          </div>

          {/* Passage Card */}
          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            <CardHeader>
              <div className="space-y-2">
                <CardTitle className="text-2xl">{passage.title}</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge>
                    {(() => {
                      const difficultyName = getDifficultyFromCefr(
                        passage.level
                      );
                      const key = difficultyName
                        .toLowerCase()
                        .replace(/\s+/g, "");
                      return t(`reading.difficultyLevels.${key}.label`);
                    })()}
                  </Badge>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {passage.wordCount} {t("reading.words")}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {passage.estimatedTime} {t("reading.minRead")}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {passage.wordsUsed.length} {t("reading.vocabularyWords")}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none leading-relaxed text-lg">
                {renderContent()}
              </div>

              <Alert className="mt-6">
                <AlertDescription className="text-sm">
                  💡 <strong>{t("reading.tipLabel")}</strong> {t("reading.highlightedTip")}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Questions Card */}
          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "200ms" }}
          >
            <CardHeader>
              <CardTitle>{t("reading.comprehensionQuestions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {passage.questions.map((q, idx) => (
                <div
                  key={idx}
                  className="space-y-3 p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary shrink-0">
                      {idx + 1}.
                    </span>
                    <p className="font-medium flex-1">{q.question}</p>
                  </div>

                  <RadioGroup
                    value={answers[idx]}
                    onValueChange={(val) => {
                      if (!submitted) {
                        setAnswers({ ...answers, [idx]: val });
                      }
                    }}
                    disabled={submitted}
                  >
                    <div className="space-y-2 ml-6">
                      {q.options.map((opt, optIdx) => {
                        const optionLetter = opt.charAt(0);
                        const isCorrect = optionLetter === q.correctAnswer;
                        const isSelected = answers[idx] === optionLetter;
                        const showFeedback = submitted;

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center space-x-2 p-2 rounded transition-colors ${
                              showFeedback && isCorrect
                                ? "bg-green-100 dark:bg-green-900/30"
                                : showFeedback && isSelected && !isCorrect
                                ? "bg-red-100 dark:bg-red-900/30"
                                : ""
                            }`}
                          >
                            <RadioGroupItem
                              value={optionLetter}
                              id={`q${idx}-${optIdx}`}
                              disabled={submitted}
                            />
                            <Label
                              htmlFor={`q${idx}-${optIdx}`}
                              className="flex-1 cursor-pointer"
                            >
                              {opt}
                            </Label>
                            {showFeedback && isCorrect && (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                            {showFeedback && isSelected && !isCorrect && (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>

                  {submitted && (
                    <Alert className="mt-3">
                      <AlertDescription className="text-sm">
                        <strong>{t("reading.explanation")}</strong> {q.explanation}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}

              {!submitted ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitMutation.isPending}
                  className="w-full hover:scale-105 transition-transform"
                  size="lg"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("reading.submitting")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t("reading.submitAnswers")}
                      {!allAnswered &&
                        ` (${Object.keys(answers).length}/${
                          passage.questions.length
                        })`}
                    </>
                  )}
                </Button>
              ) : (
                <Alert className="bg-primary/10">
                  <AlertDescription className="text-center">
                    <div className="text-2xl font-bold mb-2">
                      {correctAnswers >= 4
                        ? "🎉"
                        : correctAnswers >= 3
                        ? "👍"
                        : "💪"}{" "}
                      {t("reading.score")} {correctAnswers}/{passage.questions.length} (
                      {Math.round(
                        (correctAnswers / passage.questions.length) * 100
                      )}
                      %)
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {correctAnswers === 5 && t("reading.perfectScore")}
                      {correctAnswers === 4 && t("reading.greatJob")}
                      {correctAnswers === 3 && t("reading.goodWork")}
                      {correctAnswers < 3 && t("reading.keepStudying")}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {submitted && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push("/reading")}
                    variant="outline"
                    className="flex-1"
                  >
                    {t("reading.backToReading")}
                  </Button>
                  <Button
                    onClick={() => {
                      setAnswers({});
                      setSubmitted(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex-1"
                  >
                    {t("reading.tryAgain")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
