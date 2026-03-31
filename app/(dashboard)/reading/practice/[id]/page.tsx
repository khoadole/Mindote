"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, History, Loader2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useReadingPracticeAttemptHistory,
  useReadingPracticeDetail,
  useSubmitReadingPracticeAttempt,
  type ReadingPracticeAttemptHistoryItem,
  type SubmitReadingPracticeResult,
} from "@/hooks/use-reading-practice";
import type {
  ReadingPracticeBlock,
  ReadingPracticeQuestion,
} from "@/lib/reading-practice-types";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markdownToSafeHtml(input: string): string {
  const escaped = escapeHtml(input);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

interface PassageHighlight {
  id: string;
  start: number;
  end: number;
}

function getNodeTextOffset(
  container: HTMLElement,
  node: Node,
  offset: number
): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;
  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode === node) {
      return currentOffset + offset;
    }
    currentOffset += currentNode.textContent?.length || 0;
    currentNode = walker.nextNode();
  }

  return currentOffset;
}

function mergeHighlightRanges(ranges: PassageHighlight[]): PassageHighlight[] {
  if (ranges.length <= 1) return ranges;

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: PassageHighlight[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      continue;
    }

    merged.push(current);
  }

  return merged.map((item, index) => ({ ...item, id: `hl_${index}_${item.start}` }));
}

function optionKey(option: string): string {
  const match = option.match(/^([A-Z0-9]+)[.)\-]/);
  return match?.[1] || option;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMarkdown(input: string): string {
  return input
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function findExplanationRange(
  passage: string,
  explanation: string
): { start: number; end: number } | null {
  const cleaned = stripMarkdown(explanation).replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const sentenceCandidates = cleaned
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((item) => item.trim())
    .filter((item) => item.length >= 18);

  const candidates = [cleaned, ...sentenceCandidates].sort(
    (a, b) => b.length - a.length
  );

  for (const candidate of candidates) {
    const words = candidate.split(/\s+/).filter(Boolean);
    if (words.length < 3) continue;

    const strictPattern = words.map((word) => escapeRegex(word)).join("\\s+");
    const strictMatch = passage.match(new RegExp(strictPattern, "i"));
    if (strictMatch && strictMatch.index !== undefined) {
      return {
        start: strictMatch.index,
        end: strictMatch.index + strictMatch[0].length,
      };
    }

    const looseWords = words.slice(0, Math.min(8, words.length));
    const loosePattern = looseWords.map((word) => escapeRegex(word)).join("\\s+");
    const looseMatch = passage.match(new RegExp(loosePattern, "i"));
    if (looseMatch && looseMatch.index !== undefined) {
      return {
        start: looseMatch.index,
        end: looseMatch.index + looseMatch[0].length,
      };
    }
  }

  return null;
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
  const {
    data: attemptHistory = [],
    isLoading: historyLoading,
  } = useReadingPracticeAttemptHistory(id);
  const submitMutation = useSubmitReadingPracticeAttempt();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submittedResult, setSubmittedResult] = useState<SubmitReadingPracticeResult | null>(null);
  const [highlightRanges, setHighlightRanges] = useState<PassageHighlight[]>([]);
  const [pendingSelection, setPendingSelection] = useState<{
    start: number;
    end: number;
    x: number;
    y: number;
  } | null>(null);
  const [highlightAction, setHighlightAction] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const passageContainerRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const syncingScrollRef = useRef(false);

  useEffect(() => {
    if (!submittedResult) return;

    const left = leftPanelRef.current;
    const right = rightPanelRef.current;
    if (!left || !right) return;

    const syncFrom = (source: HTMLElement, target: HTMLElement) => {
      if (syncingScrollRef.current) return;

      const sourceMax = source.scrollHeight - source.clientHeight;
      const targetMax = target.scrollHeight - target.clientHeight;
      if (sourceMax <= 0 || targetMax <= 0) return;

      syncingScrollRef.current = true;
      const ratio = source.scrollTop / sourceMax;
      target.scrollTop = ratio * targetMax;

      requestAnimationFrame(() => {
        syncingScrollRef.current = false;
      });
    };

    const onLeftScroll = () => syncFrom(left, right);
    const onRightScroll = () => syncFrom(right, left);

    left.addEventListener("scroll", onLeftScroll, { passive: true });
    right.addEventListener("scroll", onRightScroll, { passive: true });

    return () => {
      left.removeEventListener("scroll", onLeftScroll);
      right.removeEventListener("scroll", onRightScroll);
    };
  }, [submittedResult]);

  const totalQuestions = useMemo(() => {
    return (
      part?.questionBlocks?.reduce(
        (sum, b) =>
          sum + b.questions.filter((question) => question.itemType !== "subtitle").length,
        0
      ) || 0
    );
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

  const questionMetaById = useMemo(() => {
    const meta = new Map<string, { number: number; prompt: string }>();
    if (!part?.questionBlocks) return meta;

    let number = 0;
    for (const block of part.questionBlocks) {
      for (const question of block.questions) {
        if (question.itemType === "subtitle") continue;
        number += 1;
        meta.set(question.id, {
          number,
          prompt: stripMarkdown(question.prompt || "").replace(/\s+/g, " ").trim(),
        });
      }
    }

    return meta;
  }, [part]);

  const getAttemptWrongItems = (attempt: {
    result?: {
      breakdown?: Array<{
        questionId: string;
        isCorrect: boolean;
        userAnswer: unknown;
        correctAnswer: unknown;
      }>;
    } | null;
  }) => {
    const breakdown = attempt.result?.breakdown;
    if (!Array.isArray(breakdown)) return [];

    return breakdown
      .filter((item) => item && item.isCorrect === false)
      .map((item) => {
        const meta = questionMetaById.get(item.questionId);
        return {
          questionId: item.questionId,
          questionNumber: meta?.number ?? null,
          prompt: meta?.prompt || "",
          correctAnswer: item.correctAnswer,
        };
      });
  };

  const hasHistory = attemptHistory.length > 0 || Boolean(part?.latestAttempt);

  const applyHistoryAttempt = (attempt: ReadingPracticeAttemptHistoryItem) => {
    const breakdown = Array.isArray(attempt.result?.breakdown)
      ? attempt.result?.breakdown.map((item) => ({
          ...item,
          blockId: "",
        }))
      : [];

    const restoredAnswers: Record<string, unknown> = {};
    for (const item of breakdown) {
      restoredAnswers[item.questionId] = item.userAnswer;
    }

    setAnswers(restoredAnswers);
    setSubmittedResult({
      attempt: {
        score: attempt.score,
        correctCount: attempt.correctCount,
        totalCount: attempt.totalCount,
        completedAt: attempt.completedAt,
      },
      correctCount: attempt.correctCount,
      totalCount: attempt.totalCount,
      score: attempt.score,
      breakdown,
    });
    setActiveHistoryId(attempt.id);
  };

  const handleSubmit = async () => {
    if (!part) return;
    const result = await submitMutation.mutateAsync({
      partId: part.id,
      answers,
    });
    setSubmittedResult(result);
  };

  const handlePassageMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-highlight-control='true']")) {
      return;
    }

    const container = passageContainerRef.current;
    const selection = window.getSelection();
    if (!container || !selection || selection.rangeCount === 0) {
      setPendingSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    if (selection.isCollapsed || !container.contains(range.commonAncestorContainer)) {
      setPendingSelection(null);
      return;
    }

    const start = getNodeTextOffset(container, range.startContainer, range.startOffset);
    const end = getNodeTextOffset(container, range.endContainer, range.endOffset);
    const normalizedStart = Math.max(0, Math.min(start, end));
    const normalizedEnd = Math.max(start, end);

    if (normalizedEnd <= normalizedStart) {
      setPendingSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const hostRect = container.getBoundingClientRect();

    setPendingSelection({
      start: normalizedStart,
      end: normalizedEnd,
      x: rect.left - hostRect.left,
      y: rect.top - hostRect.top - 36,
    });
    setHighlightAction(null);
  };

  const addHighlight = () => {
    if (!pendingSelection) return;

    setHighlightRanges((prev) =>
      mergeHighlightRanges([
        ...prev,
        {
          id: `hl_${Date.now()}`,
          start: pendingSelection.start,
          end: pendingSelection.end,
        },
      ])
    );

    window.getSelection()?.removeAllRanges();
    setPendingSelection(null);
  };

  const removeHighlight = (highlightId: string) => {
    setHighlightRanges((prev) => prev.filter((item) => item.id !== highlightId));
    setHighlightAction(null);
  };

  const highlightExplanationLocation = (explanation?: string) => {
    if (!part?.content || !explanation) return;

    const range = findExplanationRange(part.content, explanation);
    if (!range) return;

    setHighlightRanges((prev) =>
      mergeHighlightRanges([
        ...prev,
        {
          id: `hl_exp_${Date.now()}`,
          start: range.start,
          end: range.end,
        },
      ])
    );

    setPendingSelection(null);
    setHighlightAction(null);
  };

  const formatCorrectAnswer = (answer: unknown): string => {
    if (Array.isArray(answer)) {
      return answer.map((item) => String(item)).join(", ");
    }

    if (answer && typeof answer === "object") {
      return Object.entries(answer as Record<string, unknown>)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(" | ");
    }

    return String(answer ?? "");
  };

  const renderAnswerFeedback = (result?: {
    isCorrect?: boolean;
    correctAnswer?: unknown;
    explanation?: string;
  }) => {
    if (!result) return null;

    return (
      <div
        className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
          result.isCorrect
            ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
            : "border-rose-500/30 bg-rose-500/12 text-rose-300"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold tracking-wide">
            {result.isCorrect ? "Correct" : "Incorrect"}
          </p>
          {result.explanation && (
            <Button
              type="button"
              size="sm"
              className="h-7 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20"
              onClick={() => highlightExplanationLocation(result.explanation)}
            >
              Location
            </Button>
          )}
        </div>
        {!result.isCorrect && (
          <p className="mt-1 text-rose-200/95">
            Correct answer: {formatCorrectAnswer(result.correctAnswer)}
          </p>
        )}
        {result.explanation && (
          <div className="mt-2 space-y-1">
            <p className="text-xs uppercase tracking-wide text-foreground/70">
              Explanation:
            </p>
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {result.explanation}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderPassageContent = (content: string) => {
    if (!highlightRanges.length) {
      return <>{content}</>;
    }

    const ordered = [...highlightRanges].sort((a, b) => a.start - b.start);
    const chunks: React.ReactNode[] = [];
    let cursor = 0;

    ordered.forEach((highlight) => {
      const start = Math.max(0, Math.min(content.length, highlight.start));
      const end = Math.max(start, Math.min(content.length, highlight.end));

      if (start > cursor) {
        chunks.push(
          <span key={`text_${cursor}_${start}`}>{content.slice(cursor, start)}</span>
        );
      }

      chunks.push(
        <mark
          key={highlight.id}
          onClick={(event) => {
            event.stopPropagation();
            const container = passageContainerRef.current;
            if (!container) return;
            const hostRect = container.getBoundingClientRect();
            setPendingSelection(null);
            setHighlightAction({
              id: highlight.id,
              x: event.clientX - hostRect.left,
              y: event.clientY - hostRect.top - 36,
            });
          }}
          className="cursor-pointer bg-yellow-300/65 text-foreground"
          title="Click to manage highlight"
        >
          {content.slice(start, end)}
        </mark>
      );

      cursor = end;
    });

    if (cursor < content.length) {
      chunks.push(<span key={`text_${cursor}_end`}>{content.slice(cursor)}</span>);
    }

    return chunks;
  };

  const renderQuestionInput = (block: ReadingPracticeBlock, question: ReadingPracticeQuestion) => {
    const value = answers[question.id];

    if (
      block.type === "true-false-not-given" || block.type === "yes-no-not-given"
    ) {
      const options =
        question.options && question.options.length > 0
          ? question.options
          : block.type === "true-false-not-given"
            ? ["TRUE", "FALSE", "NOT GIVEN"]
            : ["YES", "NO", "NOT GIVEN"];

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
            {options.map((option) => {
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
    const numberedPlaceholderMatch = prompt.match(/(\d+)\s*(\[blank\]|__+)/i);
    const placeholderMatch = prompt.match(/(__+|\[blank\])/i);

    const renderBlankInput = (numberText?: string) => (
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1 ml-2">
        {numberText && (
          <span className="text-green-600 dark:text-green-400 font-semibold text-sm pl-1">
            {numberText}
          </span>
        )}
        <Input
          value={inputValue}
          onChange={(e) =>
            setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
          }
          className="w-40 h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
          placeholder="Type answer"
          autoComplete="off"
        />
      </div>
    );

    return (
      <div className="space-y-3 border rounded-lg p-4" key={question.id}>
        <div className="flex flex-wrap items-center gap-2 text-base leading-relaxed">
          {!numberedPlaceholderMatch && (
            <span className="font-semibold text-green-600 dark:text-green-400">
              {questionNumber}.
            </span>
          )}

          {numberedPlaceholderMatch ? (
            <>
              <span>{prompt.slice(0, numberedPlaceholderMatch.index)}</span>
              {renderBlankInput(numberedPlaceholderMatch[1])}
              <span>
                {prompt.slice(
                  (numberedPlaceholderMatch.index || 0) + numberedPlaceholderMatch[0].length
                )}
              </span>
            </>
          ) : placeholderMatch ? (
            <>
              <span>{prompt.slice(0, placeholderMatch.index)}</span>
              {renderBlankInput()}
              <span>
                {prompt.slice(
                  (placeholderMatch.index || 0) + placeholderMatch[0].length
                )}
              </span>
            </>
          ) : (
            <>
              <span>{prompt}</span>
              {renderBlankInput()}
            </>
          )}
        </div>

        {submittedResult && (() => {
          const result = breakdownMap.get(question.id);
          return renderAnswerFeedback(result);
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              variant="outline"
              onClick={() => setHistoryOpen(true)}
              disabled={!hasHistory || historyLoading}
              className={
                hasHistory
                  ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                  : "opacity-60"
              }
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>

            {!submittedResult && (
              <>
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
              </>
            )}
          </div>
        </div>

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-2xl border-cyan-500/25 bg-slate-950 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl">Attempt History</DialogTitle>
            </DialogHeader>

            <div className="max-h-[65vh] overflow-y-auto space-y-3 pr-1">
              {attemptHistory.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    activeHistoryId === attempt.id
                      ? "border-cyan-400/45 bg-cyan-500/10"
                      : "border-slate-700 bg-slate-900/80"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-200">
                      Attempt {attemptHistory.length - index}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-cyan-600/25 text-cyan-200 border border-cyan-500/35">
                        {attempt.score}%
                      </Badge>
                      <Button
                        size="sm"
                        className="h-7 rounded-full bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-500"
                        onClick={() => {
                          applyHistoryAttempt(attempt);
                          setHistoryOpen(false);
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  </div>

                  <p className="mt-2 text-slate-100">
                    {attempt.correctCount}/{attempt.totalCount} correct
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(attempt.completedAt).toLocaleString()}
                  </p>

                  {(() => {
                    const wrongItems = getAttemptWrongItems(attempt);
                    if (wrongItems.length === 0) {
                      return (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                          No wrong answers
                        </p>
                      );
                    }

                    return (
                      <div className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/8 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                          Wrong questions ({wrongItems.length})
                        </p>
                        <div className="mt-2 space-y-2">
                          {wrongItems.map((item) => (
                            <div
                              key={`${attempt.id}_${item.questionId}`}
                              className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2"
                            >
                              <p className="text-sm text-slate-100">
                                {item.questionNumber ? `Question ${item.questionNumber}` : "Question"}
                                {item.prompt ? `: ${item.prompt}` : ""}
                              </p>
                              <p className="mt-1 text-xs text-rose-200/95">
                                Correct answer: {formatCorrectAnswer(item.correctAnswer)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}

              {!historyLoading && attemptHistory.length === 0 && !part?.latestAttempt && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
                  No attempt history yet.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div
            ref={leftPanelRef}
            className="xl:col-span-6 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto xl:pr-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold leading-tight text-foreground">
                      {part.title}
                    </h2>
                    {part.passageSubtitle && (
                      <p className="text-sm text-muted-foreground">{part.passageSubtitle}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {part.totalQuestions} questions • {part.estimatedMinutes} min
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {part.instructions && (
                  <p
                    className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: markdownToSafeHtml(part.instructions),
                    }}
                  />
                )}
                <div
                  ref={passageContainerRef}
                  onMouseUp={handlePassageMouseUp}
                  className="relative prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed select-text"
                >
                  {renderPassageContent(part.content)}

                  {pendingSelection && (
                    <Button
                      type="button"
                      size="sm"
                      data-highlight-control="true"
                      className="absolute z-20 h-8 px-3"
                      style={{
                        left: Math.max(0, pendingSelection.x),
                        top: Math.max(0, pendingSelection.y),
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onMouseUp={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        addHighlight();
                      }}
                    >
                      Highlight
                    </Button>
                  )}

                  {highlightAction && (
                    <Button
                      type="button"
                      size="sm"
                      data-highlight-control="true"
                      className="absolute z-20 h-8 px-3 !bg-red-600 !text-white hover:!bg-red-700 border-0 shadow-lg opacity-100"
                      style={{
                        left: Math.max(0, highlightAction.x),
                        top: Math.max(0, highlightAction.y),
                      }}
                      onClick={() => removeHighlight(highlightAction.id)}
                    >
                      Remove highlight
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            ref={rightPanelRef}
            className="xl:col-span-6 space-y-6 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto xl:pl-2"
          >
            {part.questionBlocks.map((block) => (
              <Card key={block.id}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{block.title || block.type}</CardTitle>
                  {block.instruction && (
                    <p
                      className="text-sm text-muted-foreground whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: markdownToSafeHtml(block.instruction),
                      }}
                    />
                  )}
                  {isInlineBlankType(block.type) && block.sectionTitle && (
                    <h3 className="text-center text-3xl font-bold tracking-tight pt-2">
                      {block.sectionTitle}
                    </h3>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    let questionNumber = 0;

                    return block.questions.map((question) => {
                    if (question.itemType === "subtitle") {
                      return (
                        <div
                          key={question.id}
                          className="pt-1 text-xl font-semibold leading-snug text-foreground whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: markdownToSafeHtml(question.prompt),
                          }}
                        >
                        </div>
                      );
                    }

                    questionNumber += 1;
                    const result = breakdownMap.get(question.id);

                    if (isInlineBlankType(block.type)) {
                      return renderInlineBlankQuestion(block, question, questionNumber);
                    }

                    return (
                      <div key={question.id} className="space-y-3 border rounded-lg p-4">
                        <div className="font-medium whitespace-pre-wrap">
                          <span>{questionNumber}. </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: markdownToSafeHtml(question.prompt),
                            }}
                          />
                        </div>
                        {renderQuestionInput(block, question)}

                        {submittedResult && renderAnswerFeedback(result)}
                      </div>
                    );
                    });
                  })()}
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

          </div>
        </div>
      </div>
    </div>
  );
}
