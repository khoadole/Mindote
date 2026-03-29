"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReadingPracticeDetail,
  useSubmitReadingPracticeAttempt,
  type SubmitReadingPracticeResult,
} from "@/hooks/use-reading-practice";
import type {
  ReadingPracticeBlock,
  ReadingPracticeQuestion,
} from "@/lib/reading-practice-types";

function optionKey(option: string): string {
  const match = option.match(/^([A-Z0-9]+)[.)\-\s]/);
  return match?.[1] || option;
}

function isInlineBlankType(type: ReadingPracticeBlock["type"]): boolean {
  return (
    type === "fill-in-the-blank" ||
    type === "sentence-completion" ||
    type === "summary-completion" ||
    type === "diagram-label-completion"
  );
}

export default function ReadingPracticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: part, isLoading } = useReadingPracticeDetail(id);
  const submitMutation = useSubmitReadingPracticeAttempt();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submittedResult, setSubmittedResult] = useState<SubmitReadingPracticeResult | null>(null);

  const totalQuestions = useMemo(() => {
    return part?.questionBlocks?.reduce((sum, b) => sum + b.questions.length, 0) || 0;
  }, [part]);

  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter((key) => {
      const value = answers[key];
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === "object") {
        return Object.values(value as Record<string, unknown>).some((v) =>
          String(v || "").trim()
        );
      }
      return String(value || "").trim().length > 0;
    }).length;
  }, [answers]);

  const handleSubmit = async () => {
    if (!part) return;
    const result = await submitMutation.mutateAsync({
      partId: part.id,
      answers,
    });
    setSubmittedResult(result);
  };

  const renderQuestionInput = (block: ReadingPracticeBlock, question: ReadingPracticeQuestion) => {
    const value = answers[question.id];

    if (
      (block.type === "true-false-not-given" || block.type === "yes-no-not-given") &&
      question.options &&
      question.options.length > 0
    ) {
      return (
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={(next) =>
            setAnswers((prev) => ({ ...prev, [question.id]: next }))
          }
        >
          <SelectTrigger className="max-w-[260px]">
            <SelectValue placeholder="Choose answer" />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => {
              const key = optionKey(option);
              return (
                <SelectItem key={option} value={key}>
                  {option}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      );
    }

    if (
      block.type === "multiple-choice-single" &&
      question.options &&
      question.options.length > 0
    ) {
      return (
        <RadioGroup
          value={typeof value === "string" ? value : ""}
          onValueChange={(next) =>
            setAnswers((prev) => ({ ...prev, [question.id]: next }))
          }
        >
          <div className="space-y-2">
            {question.options.map((option) => {
              const key = optionKey(option);
              return (
                <div key={option} className="flex items-center gap-2">
                  <RadioGroupItem value={key} id={`${question.id}_${key}`} />
                  <Label htmlFor={`${question.id}_${key}`}>{option}</Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      );
    }

    if (block.type === "multiple-choice-multi" && question.options) {
      const selected = Array.isArray(value) ? value.map((v) => String(v)) : [];
      return (
        <div className="space-y-2">
          {question.options.map((option) => {
            const key = optionKey(option);
            const checked = selected.includes(key);
            return (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(isChecked) => {
                    setAnswers((prev) => {
                      const current = Array.isArray(prev[question.id])
                        ? (prev[question.id] as string[])
                        : [];
                      const next = isChecked
                        ? [...new Set([...current, key])]
                        : current.filter((v) => v !== key);
                      return { ...prev, [question.id]: next };
                    });
                  }}
                />
                <Label>{option}</Label>
              </div>
            );
          })}
        </div>
      );
    }

    if (question.correctAnswer && typeof question.correctAnswer === "object" && !Array.isArray(question.correctAnswer)) {
      const mapValue = (value as Record<string, string>) || {};
      return (
        <div className="space-y-2">
          {Object.keys(question.correctAnswer as Record<string, unknown>).map((key) => (
            <div key={key} className="grid grid-cols-[160px_1fr] gap-2 items-center">
              <Label>{key}</Label>
              <Input
                value={mapValue[key] || ""}
                onChange={(e) => {
                  const next = { ...(mapValue || {}), [key]: e.target.value };
                  setAnswers((prev) => ({ ...prev, [question.id]: next }));
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(question.correctAnswer)) {
      const arrValue = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {(question.correctAnswer as unknown[]).map((_, idx) => (
            <Input
              key={`${question.id}_${idx}`}
              placeholder={`Blank ${idx + 1}`}
              value={String(arrValue[idx] || "")}
              onChange={(e) => {
                const next = [...arrValue];
                next[idx] = e.target.value;
                setAnswers((prev) => ({ ...prev, [question.id]: next }));
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <Input
        value={typeof value === "string" ? value : ""}
        onChange={(e) =>
          setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
        }
        placeholder="Type your answer"
      />
    );
  };

  const renderInlineBlankQuestion = (
    block: ReadingPracticeBlock,
    question: ReadingPracticeQuestion,
    questionNumber: number
  ) => {
    const value = answers[question.id];
    const inputValue = typeof value === "string" ? value : "";

    const prompt = question.prompt || "";
    const placeholderMatch = prompt.match(/(__+|\[blank\])/i);

    return (
      <div className="space-y-3 border rounded-lg p-4" key={question.id}>
        <div className="flex flex-wrap items-center gap-2 text-base leading-relaxed">
          <span className="font-semibold text-green-600 dark:text-green-400">
            {questionNumber}.
          </span>
          {placeholderMatch ? (
            <>
              <span>{prompt.slice(0, placeholderMatch.index)}</span>
              <Input
                value={inputValue}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                }
                className="w-48"
                placeholder="..."
              />
              <span>
                {prompt.slice(
                  (placeholderMatch.index || 0) + placeholderMatch[0].length
                )}
              </span>
            </>
          ) : (
            <>
              <span>{prompt}</span>
              <Input
                value={inputValue}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                }
                className="w-48"
                placeholder="..."
              />
            </>
          )}
        </div>

        {submittedResult && (() => {
          const result = breakdownMap.get(question.id);
          return (
            <div
              className={`text-sm rounded-md px-3 py-2 ${
                result?.isCorrect
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              {result?.isCorrect ? "Correct" : "Incorrect"}
              {!result?.isCorrect && (
                <span className="ml-2">
                  Correct answer: {JSON.stringify(result?.correctAnswer)}
                </span>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!part) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Reading practice not found.</p>
        <Button onClick={() => router.push("/reading")}>Back to Reading</Button>
      </div>
    );
  }

  const breakdownMap = new Map(
    (submittedResult?.breakdown || []).map((item) => [item.questionId, item])
  );

  return (
    <div className="px-4 md:px-6 lg:px-8 py-8 min-h-screen bg-white dark:bg-background">
      <div className="w-full max-w-none mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/reading")}> 
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {part.examTitle} - Part {part.partNumber}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-6 xl:sticky xl:top-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <Badge variant="secondary">
                    {part.totalQuestions} questions • {part.estimatedMinutes} min
                  </Badge>
                </CardTitle>
                <p className="text-sm font-semibold text-foreground">{part.title}</p>
              </CardHeader>
              <CardContent>
                {part.instructions && (
                  <p className="text-sm text-muted-foreground mb-4">{part.instructions}</p>
                )}
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                  {part.content}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-6 space-y-6">
            {part.questionBlocks.map((block) => (
              <Card key={block.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{block.title || block.type}</CardTitle>
                  {block.instruction && (
                    <p className="text-sm text-muted-foreground">{block.instruction}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {block.questions.map((question, index) => {
                    const result = breakdownMap.get(question.id);

                    if (
                      isInlineBlankType(block.type) &&
                      typeof question.correctAnswer === "string"
                    ) {
                      return renderInlineBlankQuestion(block, question, index + 1);
                    }

                    return (
                      <div key={question.id} className="space-y-3 border rounded-lg p-4">
                        <div className="font-medium">
                          {index + 1}. {question.prompt}
                        </div>
                        {renderQuestionInput(block, question)}

                        {submittedResult && (
                          <div
                            className={`text-sm rounded-md px-3 py-2 ${
                              result?.isCorrect
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {result?.isCorrect ? "Correct" : "Incorrect"}
                            {!result?.isCorrect && (
                              <span className="ml-2">
                                Correct answer: {JSON.stringify(result?.correctAnswer)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}

            {submittedResult && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold mb-2">
                    {submittedResult.correctCount}/{submittedResult.totalCount}
                  </p>
                  <p className="text-muted-foreground">Score: {submittedResult.score}%</p>
                </CardContent>
              </Card>
            )}

            {!submittedResult && (
              <div className="sticky bottom-4">
                <Card>
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Answered: {answeredCount}/{totalQuestions}
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitMutation.isPending || answeredCount === 0}
                    >
                      {submitMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Submit answers
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
