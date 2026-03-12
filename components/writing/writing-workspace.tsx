"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Clock, TrendingUp, BookOpen, History, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { WritingFeedback } from "@/components/writing/writing-feedback";
import { useEvaluateWriting, useWritingAttempts, useWritingUsage } from "@/hooks/use-writing";
import type { WritingPassage, AIWritingResult } from "@/lib/types";
import { useTranslation } from "@/lib/i18n-provider";
import { format } from "date-fns";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  A2: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  B1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  B2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  C1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  C2: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface WritingWorkspaceProps {
  passage: WritingPassage;
  onBack: () => void;
}

export function WritingWorkspace({
  passage,
  onBack,
}: WritingWorkspaceProps) {
  const { t } = useTranslation();
  const [userText, setUserText] = useState("");
  const [currentResult, setCurrentResult] = useState<AIWritingResult | null>(null);
  const [currentAttemptText, setCurrentAttemptText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("write");

  const evaluateMutation = useEvaluateWriting();
  const { data: attempts } = useWritingAttempts(passage.id);
  const { data: usageData } = useWritingUsage();

  const isPremium = usageData?.isPremium ?? false;
  const remainingUses = usageData?.remainingUses ?? -1;

  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const canEvaluate =
    wordCount >= 10 && !evaluateMutation.isPending && (isPremium || remainingUses === -1 || remainingUses > 0);

  const handleEvaluate = useCallback(async () => {
    const result = await evaluateMutation.mutateAsync({
      passageId: passage.id,
      userText,
    });
    setCurrentResult(result.aiResult);
    setCurrentAttemptText(userText);
    setActiveTab("result");
  }, [evaluateMutation, passage.id, userText]);

  function handleTryAgain() {
    setCurrentResult(null);
    setCurrentAttemptText("");
    setActiveTab("write");
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("writing.browse")}
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base truncate">{passage.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${LEVEL_COLORS[passage.level] ?? ""}`}
            >
              {passage.level}
            </span>
            <span className="text-xs text-muted-foreground">{passage.topic}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {passage.estimatedMinutes}m
            </span>
          </div>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Source Text */}
        <div className="space-y-3">
          <Card className="border border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("writing.sourcePromptLabel")}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {passage.sourceText}
              </p>
            </CardContent>
          </Card>

          {/* Grammar focus hint */}
          {passage.grammarFocus && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10 px-3 py-2">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">{t("writing.grammarFocusLabel")}:</span>{" "}
                {passage.grammarFocus}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {t("writing.targetWordCount").replace("{count}", String(passage.targetWordCount))}
          </div>
        </div>

        {/* Right: Writing + Results */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="write" className="flex-1">
                {t("writing.tabWrite")}
              </TabsTrigger>
              <TabsTrigger
                value="result"
                className="flex-1"
                disabled={!currentResult}
              >
                {t("writing.tabFeedback")}
              </TabsTrigger>
              <TabsTrigger value="attempts" className="flex-1">
                <History className="h-3.5 w-3.5 mr-1" />
                {t("writing.tabHistory")}
              </TabsTrigger>
              <TabsTrigger value="reference" className="flex-1">
                {t("writing.tabReference")}
              </TabsTrigger>
            </TabsList>

            {/* Write Tab */}
            <TabsContent value="write" className="space-y-3 mt-0">
              <Textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder={t("writing.writingPlaceholder")}
                rows={10}
                className="resize-none text-sm leading-relaxed"
                disabled={evaluateMutation.isPending}
              />

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div
                    className={wordCount < 10 ? "text-amber-500" : "text-muted-foreground"}
                  >
                    {wordCount} {t("writing.wordCount")}
                    {wordCount < 10 && ` ${t("writing.minWords")}`}
                  </div>
                  {!isPremium && remainingUses >= 0 && (
                    <div
                      className={remainingUses === 0 ? "text-destructive" : ""}
                    >
                      {remainingUses} {t("writing.remainingUses").replace("{count}", String(remainingUses))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleEvaluate}
                  disabled={!canEvaluate}
                  className="gap-2"
                >
                  {evaluateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("writing.evaluating")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {t("writing.evaluate")}
                    </>
                  )}
                </Button>
              </div>

              {!isPremium && remainingUses === 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {t("writing.limitReachedMessage")}
                </div>
              )}
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="result" className="mt-0 space-y-3">
              {currentResult ? (
                <>
                  {currentAttemptText && (
                    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                        {t("writing.yourSubmission")}
                      </p>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                        {currentAttemptText}
                      </p>
                    </div>
                  )}
                  <WritingFeedback
                    result={currentResult}
                    onTryAgain={handleTryAgain}
                  />
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {t("writing.noFeedback")}
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="attempts" className="mt-0">
              {!attempts || attempts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {t("writing.noHistory")}
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.map((attempt, idx) => (
                    <Card
                      key={attempt.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => {
                        if (attempt.aiResult) {
                          setCurrentResult(attempt.aiResult);
                          setCurrentAttemptText(attempt.userText);
                          setActiveTab("result");
                        }
                      }}
                    >
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {t("writing.attemptLabel")} #{attempts.length - idx}
                          </span>
                          <div className="flex items-center gap-2">
                            {attempt.score !== null && (
                              <Badge variant="secondary" className="text-xs">
                                {attempt.score.toFixed(1)}/10
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(attempt.completedAt), "MMM d, HH:mm")}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {attempt.userText}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reference Tab */}
            <TabsContent value="reference" className="mt-0">
              <Card className="border border-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("writing.referenceAnswer")}
                    </span>
                  </div>
                  {passage.referenceText ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {passage.referenceText}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {t("writing.noReference")}
                    </p>
                  )}
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground mt-2">
                {t("writing.referenceNote")}
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
