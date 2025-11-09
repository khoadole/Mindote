"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useReadingPassage, useSubmitAttempt } from "@/hooks/use-reading";
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

export default function ReadingPassageViewer() {
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
          <p className="text-muted-foreground">Loading passage...</p>
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
          <h2 className="text-xl font-semibold mb-2">Passage not found</h2>
          <p className="text-muted-foreground mb-4">
            This reading passage doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/reading")}>
            Back to Reading
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
    const words = passage.content.split(/(\s+)/);
    return words.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, "");
      const isLearned = passage.wordsUsed.some(
        (w) => w.toLowerCase() === cleanWord
      );

      return (
        <span
          key={idx}
          className={
            isLearned
              ? "bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-800 transition-colors"
              : ""
          }
          onClick={() => isLearned && setHighlightedWord(cleanWord)}
          title={isLearned ? "Click to see definition" : ""}
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/reading")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reading
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
                <Badge>{passage.level}</Badge>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {passage.wordCount} words
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {passage.estimatedTime} min read
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {passage.wordsUsed.length} vocabulary words
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
                💡 <strong>Tip:</strong> Highlighted words are from your
                vocabulary collection.
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
            <CardTitle>Comprehension Questions</CardTitle>
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
                  <Alert className="mt-3 ml-6">
                    <AlertDescription className="text-sm">
                      <strong>Explanation:</strong> {q.explanation}
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Answers
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
                    Score: {correctAnswers}/{passage.questions.length} (
                    {Math.round(
                      (correctAnswers / passage.questions.length) * 100
                    )}
                    %)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {correctAnswers === 5 && "Perfect score! Excellent work!"}
                    {correctAnswers === 4 && "Great job! Almost perfect!"}
                    {correctAnswers === 3 && "Good work! Keep practicing!"}
                    {correctAnswers < 3 && "Keep studying, you'll improve!"}
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
                  Back to Reading
                </Button>
                <Button
                  onClick={() => {
                    setAnswers({});
                    setSubmitted(false);
                    window.scrollTo(0, 0);
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
