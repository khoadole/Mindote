"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useAllWords } from "@/hooks/use-words";
import { useCollections, useCollection } from "@/hooks/use-collections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Play,
  ArrowLeft,
  Target,
  Edit,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";

// ✅ Lazy load QuizPlayer - only load when user starts quiz
const QuizPlayer = dynamic(
  () =>
    import("@/components/quiz-player").then((mod) => ({
      default: mod.QuizPlayer,
    })),
  {
    ssr: false,
    loading: () => {
      const { t } = useTranslation();
      return (
        <div className="p-6 flex items-center justify-center min-h-screen bg-white dark:bg-background">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{t("common.loading")}</span>
          </div>
        </div>
      );
    },
  }
);

export default function QuizPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get("collection"); // specific collection ID

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const { data: words = [], isLoading: wordsLoading } = useAllWords();
  const { data: collections = [], isLoading: collectionsLoading } =
    useCollections();
  const { data: specificCollection } = useCollection(collectionParam || "");
  const { toast } = useToast();

  const [selectedScope, setSelectedScope] = useState<string>(
    collectionParam || "all"
  );
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [questionType, setQuestionType] = useState<
    "multiple-choice" | "fill-blank"
  >("multiple-choice");
  const [isQuizzing, setIsQuizzing] = useState(false);

  const isLoading = wordsLoading || collectionsLoading;

  // Set scope based on URL params
  useEffect(() => {
    if (collectionParam) {
      setSelectedScope(collectionParam);
    }
  }, [collectionParam]);

  const getQuizWords = () => {
    if (!words) return [];
    if (selectedScope === "all") {
      return words;
    }
    return words.filter((word) => word.collectionId === selectedScope);
  };

  const quizWords = getQuizWords();

  // For fill-blank mode, count only words with examples that contain the term
  const getValidFillBlankWords = () => {
    return quizWords.filter((word) => {
      const example = word.example?.trim();
      if (!example) return false;
      const termRegex = new RegExp(`\\b${word.term}\\b`, "gi");
      return termRegex.test(example);
    });
  };

  const validQuizWords =
    questionType === "fill-blank" ? getValidFillBlankWords() : quizWords;

  const handleStartQuiz = () => {
    if (questionType === "fill-blank") {
      const validWords = getValidFillBlankWords();
      if (validWords.length < 2) {
        toast({
          title: t("quiz.notEnoughWordsWithExamples"),
          description: t("quiz.fillBlankRequirement"),
          variant: "destructive",
        });
        return;
      }
    } else {
      if (quizWords.length < 2) {
        toast({
          title: t("quiz.notEnoughWords"),
          description: t("quiz.needAtLeastTwoWords"),
          variant: "destructive",
        });
        return;
      }
    }
    setIsQuizzing(true);
  };

  const handleQuizComplete = (results: {
    score: number;
    total: number;
    questions: any[];
  }) => {
    const percentage = Math.round((results.score / results.total) * 100);
    toast({
      title: t("quiz.quizComplete"),
      description: t("quiz.scoreResult", { percentage, score: results.score, total: results.total }),
    });
    setIsQuizzing(false);
  };

  const handleExit = () => {
    setIsQuizzing(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-white dark:bg-background relative overflow-hidden transition-all duration-300">
        <div className="flex items-center gap-2 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (isQuizzing) {
    return (
      <div className="p-8 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
        <QuizPlayer
            words={validQuizWords as any}
            mode={questionType}
            onComplete={handleQuizComplete}
            onExit={handleExit}
          />
      </div>
    );
  }

  return (
    <div className="p-8 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
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
              <CheckCircle className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">
                {collectionParam && specificCollection
                  ? t("quiz.quizWithCollection", { name: specificCollection.name })
                  : t("quiz.title")}
              </h1>
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
                  <CardTitle>{t("quiz.quizSettings")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mode">{t("quiz.quizMode")}</Label>
                    <Tabs
                      value={questionType}
                      onValueChange={(value) =>
                        setQuestionType(
                          value as "multiple-choice" | "fill-blank"
                        )
                      }
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="multiple-choice"
                          className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          MCQ
                        </TabsTrigger>
                        <TabsTrigger
                          value="fill-blank"
                          className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Fill
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scope">{t("quiz.questionSource")}</Label>
                    <Select
                      value={selectedScope}
                      onValueChange={setSelectedScope}
                    >
                      <SelectTrigger className="truncate">
                        <SelectValue placeholder={t("flashcards.selectScope")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="truncate">
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

                  <Button
                    onClick={handleStartQuiz}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                    disabled={validQuizWords.length < 2}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t("quiz.startQuiz")}
                  </Button>
                  {questionType === "fill-blank" &&
                    validQuizWords.length < quizWords.length && (
                      <p className="text-xs text-muted-foreground text-center">
                        {validQuizWords.length} / {quizWords.length} {t("quiz.words")}
                      </p>
                    )}
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
                  <CardTitle>{t("quiz.quizPreview")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {validQuizWords.length >= 2 ? (
                    <div className="space-y-4">
                      <Tabs value={questionType} className="w-full">
                        <TabsContent value="multiple-choice">
                          <div className="space-y-4">
                            <div className="p-6 border-2 border-dashed border-border rounded-lg">
                              <h3 className="font-semibold mb-2">
                                {t("quiz.quizPreview")}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {t("quiz.fillBlankDescription")}
                              </p>
                              <div className="bg-muted p-4 rounded">
                                <h4 className="font-medium mb-2 break-words">
                                  {quizWords[0]?.term}
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div className="p-2 bg-background rounded break-words">
                                    A. {quizWords[0]?.definition}
                                  </div>
                                  <div className="p-2 bg-background rounded break-words">
                                    B. Sample distractor option
                                  </div>
                                  <div className="p-2 bg-background rounded break-words">
                                    C. Another distractor option
                                  </div>
                                  <div className="p-2 bg-background rounded break-words">
                                    D. Third distractor option
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="fill-blank">
                          <div className="space-y-4">
                            <div className="p-6 border-2 border-dashed border-border rounded-lg">
                              <h3 className="font-semibold mb-2">
                                {t("quiz.fillBlankPreview")}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {t("quiz.fillBlankDescription")}
                              </p>
                              <div className="bg-muted p-4 rounded">
                                <p className="mb-2 break-words">
                                  {validQuizWords[0]?.example?.replace(
                                    new RegExp(validQuizWords[0]?.term, "gi"),
                                    "_____"
                                  ) ||
                                    "Example: She picked a shiny red _____ from the tree."}
                                </p>
                                <input
                                  className="w-full p-2 border rounded bg-background"
                                  placeholder={t("quiz.typeYourAnswer")}
                                  disabled
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {validQuizWords.length}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("quiz.questions")}
                          </p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-accent">
                            {Math.ceil(validQuizWords.length * 1.5)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("quiz.estMinutes")}
                          </p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-chart-3">
                            {questionType === "multiple-choice" ? "4" : "1"}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {questionType === "multiple-choice"
                              ? t("quiz.options")
                              : t("quiz.answer")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        {questionType === "fill-blank"
                          ? t("quiz.notEnoughWordsWithExamples")
                          : t("quiz.notEnoughWords")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {questionType === "fill-blank"
                          ? t("quiz.currentlyValid", {
                              count: validQuizWords.length,
                              word: validQuizWords.length === 1 ? t("quiz.word") : t("quiz.words")
                            })
                          : `${t("quiz.needAtLeastTwoWords")} ${
                              selectedScope === "all"
                                ? t("quiz.addMoreWords")
                                : t("quiz.collectionNeedsMoreWords")
                            }`}
                      </p>
                      <div className="flex gap-2 justify-center">
                        {questionType === "fill-blank" &&
                          quizWords.length >= 2 && (
                            <Button
                              variant="default"
                              onClick={() => setQuestionType("multiple-choice")}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all hover:scale-105 shadow-lg"
                            >
                              {t("quiz.switchToMultipleChoice")}
                            </Button>
                          )}
                        <Button
                          variant="outline"
                          onClick={() => router.push("/collections")}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all hover:scale-105 shadow-lg border-0"
                        >
                          {t("quiz.goToCollections")}
                        </Button>
                      </div>
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
