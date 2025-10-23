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

// ✅ Lazy load QuizPlayer - only load when user starts quiz
const QuizPlayer = dynamic(
  () =>
    import("@/components/quiz-player").then((mod) => ({
      default: mod.QuizPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading quiz player...</span>
        </div>
      </div>
    ),
  }
);

export default function QuizPage() {
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

  const handleStartQuiz = () => {
    if (quizWords.length < 2) {
      toast({
        title: "Not enough words",
        description: "You need at least 2 words to start a quiz.",
        variant: "destructive",
      });
      return;
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
      title: "Quiz complete!",
      description: `You scored ${percentage}% (${results.score}/${results.total})`,
    });
    setIsQuizzing(false);
  };

  const handleExit = () => {
    setIsQuizzing(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading quiz data...</span>
        </div>
      </div>
    );
  }

  if (isQuizzing) {
    return (
      <div className="p-6">
        <QuizPlayer
          words={quizWords as any}
          mode={questionType}
          onComplete={handleQuizComplete}
          onExit={handleExit}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
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
            Back
          </Button>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">
              {collectionParam && specificCollection
                ? `Quiz: ${specificCollection.name}`
                : "Quiz"}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mode">Quiz Mode</Label>
                  <Tabs
                    value={questionType}
                    onValueChange={(value) =>
                      setQuestionType(value as "multiple-choice" | "fill-blank")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="multiple-choice" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        MCQ
                      </TabsTrigger>
                      <TabsTrigger value="fill-blank" className="text-xs">
                        <Edit className="h-3 w-3 mr-1" />
                        Fill
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Question Source</Label>
                  <Select
                    value={selectedScope}
                    onValueChange={setSelectedScope}
                  >
                    <SelectTrigger className="truncate">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="truncate">
                        All Words ({words?.length || 0})
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
                  className="w-full"
                  disabled={quizWords.length < 2}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {quizWords.length >= 2 ? (
                  <div className="space-y-4">
                    <Tabs value={questionType} className="w-full">
                      <TabsContent value="multiple-choice">
                        <div className="space-y-4">
                          <div className="p-6 border-2 border-dashed border-border rounded-lg">
                            <h3 className="font-semibold mb-2">
                              Multiple Choice Preview
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              You'll see a word and choose the correct
                              definition from 4 options.
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
                              Fill in the Blank Preview
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              You'll see a sentence with a missing word and type
                              the correct answer.
                            </p>
                            <div className="bg-muted p-4 rounded">
                              <p className="mb-2">
                                {quizWords[0]?.example?.replace(
                                  new RegExp(quizWords[0]?.term, "gi"),
                                  "____"
                                ) || "The word is: ____"}
                              </p>
                              <input
                                className="w-full p-2 border rounded bg-background"
                                placeholder="Type your answer..."
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
                          {quizWords.length}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Questions
                        </p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-accent">
                          {Math.ceil(quizWords.length * 1.5)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Est. Minutes
                        </p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-chart-3">
                          {questionType === "multiple-choice" ? "4" : "1"}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {questionType === "multiple-choice"
                            ? "Options"
                            : "Answer"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Not Enough Words
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      You need at least 2 words to start a quiz.
                      {selectedScope === "all"
                        ? " Add more words to your vocabulary."
                        : " This collection needs more words."}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/collections")}
                    >
                      Go to Collections
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
