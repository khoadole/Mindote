"use client";

import { useState } from "react";
import {
  CheckCircle2,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddWordModal } from "@/components/modals/add-word-modal";
import { useTranslation } from "@/lib/i18n-provider";
import type { AIWritingResult } from "@/lib/types";

interface WritingFeedbackProps {
  result: AIWritingResult;
  onTryAgain: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  A2: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  B1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  B2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  C1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  C2: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color =
    score >= 8
      ? "bg-green-500"
      : score >= 6
        ? "bg-blue-500"
        : score >= 4
          ? "bg-yellow-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-7 text-right">
        {score}/10
      </span>
    </div>
  );
}

/** Renders text with each word wrapped for double-click-to-add-word */
function ClickableText({
  text,
  onWordDoubleClick,
  className,
}: {
  text: string;
  onWordDoubleClick: (word: string) => void;
  className?: string;
}) {
  const words = text.split(/(\s+)/);
  return (
    <span className={className}>
      {words.map((part, i) =>
        /\s+/.test(part) ? (
          part
        ) : (
          <span
            key={i}
            onDoubleClick={() => {
              const clean = part.replace(/[^a-zA-Z'-]/g, "");
              if (clean.length > 1) onWordDoubleClick(clean);
            }}
            className="cursor-text hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded px-0.5 transition-colors select-none"
            title="Double-click to add to vocabulary"
          >
            {part}
          </span>
        ),
      )}
    </span>
  );
}

export function WritingFeedback({ result, onTryAgain }: WritingFeedbackProps) {
  const { t } = useTranslation();
  const [addWordTerm, setAddWordTerm] = useState<string | null>(null);

  function handleWordDoubleClick(word: string) {
    setAddWordTerm(word);
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overall Score Header */}
      <Card className="border-b-[3px] border-b-purple-400 dark:border-b-purple-600 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Big score */}
            <div className="text-center">
              <div className="text-4xl font-bold tabular-nums">
                {result.overallScore.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">/ 10</div>
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${LEVEL_COLORS[result.estimatedLevel] ?? ""}`}
                >
                  {result.estimatedLevel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {result.wordCount} {t("writing.wordCount")}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-muted-foreground shrink-0">
                    {t("writing.grammar")}
                  </span>
                  <ScoreBar score={result.grammar.score} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-muted-foreground shrink-0">
                    {t("writing.spelling")}
                  </span>
                  <ScoreBar score={result.spelling.score} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-muted-foreground shrink-0">
                    {t("writing.vocabulary")}
                  </span>
                  <ScoreBar score={result.vocabulary.score} />
                </div>
              </div>
            </div>
          </div>

          {result.lengthFeedback && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {result.lengthFeedback}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            {t("writing.strengths")}
          </h4>
          <div className="space-y-2">
            {result.strengths.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/10 p-3"
              >
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  {s.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.detail}
                </p>
                {s.quote && (
                  <p className="text-xs mt-1 italic text-green-700 dark:text-green-400 border-l-2 border-green-300 pl-2">
                    &ldquo;{s.quote}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5 text-orange-700 dark:text-orange-400">
            <TrendingUp className="h-4 w-4" />
            {t("writing.improvements")}
          </h4>
          <p className="text-xs text-muted-foreground -mt-1">
            {t("writing.doubletapHint")}
          </p>
          <div className="space-y-3">
            {result.improvements.map((imp, i) => (
              <div
                key={i}
                className="rounded-lg border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/10 p-3 space-y-2"
              >
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  {i + 1}. {imp.title}
                </p>
                {imp.original && (
                  <div className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded p-2 font-mono">
                    <span className="text-muted-foreground mr-1">You:</span>
                    <span className="text-red-700 dark:text-red-400 line-through">
                      {imp.original}
                    </span>
                  </div>
                )}
                {imp.corrected && (
                  <div className="text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded p-2 font-mono">
                    <span className="text-muted-foreground mr-1">
                      Corrected:
                    </span>
                    <ClickableText
                      text={imp.corrected}
                      onWordDoubleClick={handleWordDoubleClick}
                      className="text-green-700 dark:text-green-400 font-semibold"
                    />
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Why: </span>
                  <ClickableText
                    text={imp.explanation}
                    onWordDoubleClick={handleWordDoubleClick}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary highlights + suggestions */}
      {(result.vocabulary.highlights.length > 0 ||
        result.vocabulary.suggestions.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-blue-500" />
            {t("writing.vocabulary")}
          </h4>
          {result.vocabulary.highlights.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                {t("writing.wordsUsedWell")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.vocabulary.highlights.map((word, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {result.vocabulary.suggestions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                {t("writing.betterChoices")}
              </p>
              <div className="space-y-1.5">
                {result.vocabulary.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="text-xs flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10 px-3 py-2"
                  >
                    <span className="text-muted-foreground line-through">
                      {s.original}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <ClickableText
                      text={s.better}
                      onWordDoubleClick={handleWordDoubleClick}
                      className="font-semibold text-blue-700 dark:text-blue-400"
                    />
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spelling errors */}
      {result.spelling.errors.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium mb-1.5">{t("writing.spellingErrors")}:</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {result.spelling.errors.map((err, i) => (
              <span key={i} className="text-xs">
                <span className="line-through text-red-600 dark:text-red-400">
                  {err.original}
                </span>{" "}
                →{" "}
                <ClickableText
                  text={err.correction}
                  onWordDoubleClick={handleWordDoubleClick}
                  className="font-medium text-green-700 dark:text-green-400"
                />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Coach's encouragement */}
      <div className="rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/10 p-4">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-0.5">
              {t("writing.coachNote")}
            </p>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {result.encouragement}
            </p>
          </div>
        </div>
      </div>

      {/* Try Again button */}
      <Button variant="outline" onClick={onTryAgain} className="w-full">
        <RotateCcw className="h-4 w-4 mr-2" />
        {t("writing.tryAgain")}
      </Button>

      {/* AddWordModal (controlled) */}
      {addWordTerm && (
        <AddWordModal
          open={!!addWordTerm}
          onOpenChange={(open) => {
            if (!open) setAddWordTerm(null);
          }}
          defaultTerm={addWordTerm}
        />
      )}
    </div>
  );
}
