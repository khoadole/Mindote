"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollections } from "@/hooks/use-collections";
import { useWords } from "@/hooks/use-words";
import { useGeneratePassage, useReadingPassages } from "@/hooks/use-reading";
import {
  DIFFICULTY_LEVELS,
  getCefrCode,
  getDifficultyFromCefr,
  getTranslationKeyFromCefr,
} from "@/lib/difficulty-levels";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import {
  IELTS_QUESTION_TYPES,
  getQuestionTypeLabel,
  getQuestionTypeDescription,
} from "@/lib/reading-question-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Loader2,
  Clock,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n-provider";

// Using DIFFICULTY_LEVELS from lib/difficulty-levels.ts

const PASSAGE_TYPES = [
  {
    value: "story",
    label: "Story",
    description: "Narrative with characters and plot",
  },
  {
    value: "article",
    label: "Article",
    description: "Informative news or magazine style",
  },
  {
    value: "essay",
    label: "Essay",
    description: "Opinion or argumentative piece",
  },
  { value: "news", label: "News", description: "Current events and facts" },
];

export default function ReadingPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: passages, isLoading: passagesLoading } = useReadingPassages();
  const generateMutation = useGeneratePassage();

  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("Intermediate");
  const [passageType, setPassageType] = useState<string>("story");
  const [questionType, setQuestionType] = useState<string>("multiple-choice");
  const [contentLanguage, setContentLanguage] =
    useState<string>(DEFAULT_LANGUAGE);
  const [currentPage, setCurrentPage] = useState(1);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const ITEMS_PER_PAGE = 4;
  const MAX_WORDS = 20;

  // Fetch words when collection is selected
  const { data: collectionWords, isLoading: wordsLoading } =
    useWords(selectedCollection);

  // Reset word selection when collection changes
  useEffect(() => {
    setSelectedWordIds([]);
  }, [selectedCollection]);

  const hasCollections = collections && collections.length > 0;
  const selectedCollectionData = collections?.find(
    (c) => c.id === selectedCollection,
  );

  // Pagination logic
  const totalPages = passages ? Math.ceil(passages.length / ITEMS_PER_PAGE) : 0;
  const paginatedPassages = passages
    ? passages.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      )
    : [];

  // Word selection handlers
  const handleWordToggle = (wordId: string) => {
    setSelectedWordIds((prev) => {
      if (prev.includes(wordId)) {
        return prev.filter((id) => id !== wordId);
      }
      if (prev.length >= MAX_WORDS) {
        return prev; // Don't add if at limit
      }
      return [...prev, wordId];
    });
  };

  const handleSelectAll = () => {
    if (collectionWords) {
      setSelectedWordIds(collectionWords.slice(0, MAX_WORDS).map((w) => w.id));
    }
  };

  const handleClearAll = () => {
    setSelectedWordIds([]);
  };

  const handleGenerate = () => {
    if (!selectedCollection) {
      return;
    }

    // Use selected words if any, otherwise API will use all words
    const params: any = {
      collectionId: selectedCollection,
      level: getCefrCode(level) as any,
      passageType: passageType as any,
      questionType: questionType as any,
      language: contentLanguage,
    };

    if (selectedWordIds.length > 0) {
      params.selectedWordIds = selectedWordIds;
    }

    generateMutation.mutate(params);
  };

  // Determine minimum words requirement
  const hasEnoughWords =
    selectedWordIds.length >= 5 || selectedWordIds.length === 0;

  return (
    <div className="p-8 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
      <div className="relative z-10 p-6 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <Button
              variant="outline"
              size="default"
              onClick={() => router.push("/dashboard")}
              className="text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">{t("reading.title")}</h1>
              </div>
              <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t("reading.howItWorks")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("reading.howItWorks")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>{t("reading.chooseCollectionStep", { count: 5 })}</p>
                    <p>{t("reading.selectDifficultyStep")}</p>
                    <p>{t("reading.aiGeneratesStep")}</p>
                    <p>{t("reading.readAnswerStep")}</p>
                    <p>{t("reading.trackProgressStep")}</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generation Form */}
            <div className="lg:col-span-1 space-y-6">
              <Card
                className="animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
                style={{ animationDelay: "100ms" }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t("reading.generatePassage")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!hasCollections ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        {t("reading.needCollectionFirst")}
                      </p>
                      <Button onClick={() => router.push("/collections")}>
                        {t("collections.goToCollections")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>{t("reading.selectCollection")}</Label>
                        <Select
                          value={selectedCollection}
                          onValueChange={setSelectedCollection}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("reading.chooseCollection")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map((collection) => (
                              <SelectItem
                                key={collection.id}
                                value={collection.id}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-3 w-3 rounded ${collection.color}`}
                                  />
                                  <span>{collection.name}</span>
                                  <span className="text-muted-foreground">
                                    ({collection.wordCount || 0}{" "}
                                    {t("reading.words")})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCollectionData &&
                          (selectedCollectionData.wordCount || 0) < 5 && (
                            <p className="text-sm text-destructive">
                              {t("reading.needAtLeastWords", { count: 5 })}
                            </p>
                          )}
                      </div>

                      {/* Word Selector */}
                      {selectedCollection &&
                        collectionWords &&
                        collectionWords.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>{t("reading.selectWords")}</Label>
                              <span className="text-xs text-muted-foreground">
                                {selectedWordIds.length}/{MAX_WORDS}{" "}
                                {t("reading.selected")}
                              </span>
                            </div>

                            <div className="flex gap-2 mb-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                disabled={selectedWordIds.length >= MAX_WORDS}
                              >
                                <CheckSquare className="h-3 w-3 mr-1" />
                                {t("common.selectAll")}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClearAll}
                                disabled={selectedWordIds.length === 0}
                              >
                                <Square className="h-3 w-3 mr-1" />
                                {t("common.clearAll")}
                              </Button>
                            </div>

                            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                              {wordsLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                collectionWords.map((word) => (
                                  <div
                                    key={word.id}
                                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                                      selectedWordIds.includes(word.id)
                                        ? "bg-primary/10"
                                        : ""
                                    }`}
                                    onClick={() => handleWordToggle(word.id)}
                                  >
                                    <Checkbox
                                      checked={selectedWordIds.includes(
                                        word.id,
                                      )}
                                      onCheckedChange={() =>
                                        handleWordToggle(word.id)
                                      }
                                      disabled={
                                        !selectedWordIds.includes(word.id) &&
                                        selectedWordIds.length >= MAX_WORDS
                                      }
                                    />
                                    <span className="text-sm font-medium">
                                      {word.term}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>

                            {selectedWordIds.length > 0 &&
                              selectedWordIds.length < 5 && (
                                <p className="text-xs text-destructive">
                                  {t("reading.selectAtLeast5")}
                                </p>
                              )}

                            <p className="text-xs text-muted-foreground">
                              {t("reading.wordSelectionHint")}
                            </p>
                          </div>
                        )}

                      <div className="space-y-2">
                        <Label>{t("reading.difficultyLevel")}</Label>
                        <Select value={level} onValueChange={setLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTY_LEVELS.map((l) => (
                              <SelectItem key={l.value} value={l.value}>
                                <div>
                                  <div className="font-medium">
                                    {t(
                                      `reading.difficultyLevels.${l.translationKey}.label`,
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t(
                                      `reading.difficultyLevels.${l.translationKey}.description`,
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("reading.passageType")}</Label>
                        <Select
                          value={passageType}
                          onValueChange={setPassageType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PASSAGE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div>
                                  <div className="font-medium">
                                    {t(
                                      `reading.passageTypes.${type.value}.label`,
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t(
                                      `reading.passageTypes.${type.value}.description`,
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Question Type Selector */}
                      <div className="space-y-2">
                        <Label>{t("reading.questionType")}</Label>
                        <Select
                          value={questionType}
                          onValueChange={setQuestionType}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {getQuestionTypeLabel(questionType, language)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[400px]">
                            {IELTS_QUESTION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="py-1">
                                  <div className="font-medium text-sm">
                                    {getQuestionTypeLabel(type.value, language)}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {getQuestionTypeDescription(
                                      type.value,
                                      language,
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t("reading.questionTypeHint")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("reading.language")}</Label>
                        <Select
                          value={contentLanguage}
                          onValueChange={setContentLanguage}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                <div className="flex items-center gap-2">
                                  <span>{lang.flag}</span>
                                  <span>{lang.nativeName}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t("reading.languageDescription")}
                        </p>
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={
                          !selectedCollection ||
                          generateMutation.isPending ||
                          (selectedCollectionData?.wordCount || 0) < 5
                        }
                        className="w-full hover:scale-105 transition-transform"
                      >
                        {generateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("reading.generating")}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t("reading.generatePassage")}
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        {t("reading.aiWillCreate")}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Reading Passages List */}
            <div
              className="lg:col-span-2 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
              style={{ animationDelay: "200ms" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t("reading.yourPassages")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {passagesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-4 border rounded-lg bg-muted/50 animate-pulse"
                        >
                          <div className="h-6 w-2/3 bg-muted rounded mb-2" />
                          <div className="h-4 w-1/3 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : !passages || passages.length === 0 ? (
                    <div className="text-center py-16">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        {t("reading.noPassagesYet")}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {t("reading.generateFirst")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedPassages.map((passage, index) => (
                        <Link
                          key={passage.id}
                          href={`/reading/${passage.id}`}
                          className="block"
                        >
                          <div
                            className="group p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 hover:border-primary transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                            style={{
                              animationDelay: `${index * 50}ms`,
                              animationDuration: "300ms",
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors truncate">
                                  {passage.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="secondary">
                                    {t(
                                      `reading.difficultyLevels.${getTranslationKeyFromCefr(passage.level)}.label`,
                                    )}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {passage.wordCount} {t("reading.words")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {passage.estimatedTime} min
                                  </span>
                                  {passage._count &&
                                    passage._count.attempts > 0 && (
                                      <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {passage._count.attempts}{" "}
                                        {t("reading.attempts", {
                                          count: passage._count.attempts,
                                        })}
                                      </span>
                                    )}
                                </div>
                                {passage.collection && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <div
                                      className={`h-3 w-3 rounded ${passage.collection.color}`}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      {passage.collection.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                {t("reading.read")}
                              </Button>
                            </div>
                          </div>
                        </Link>
                      ))}

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                            className="rounded-xl"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: totalPages },
                              (_, i) => i + 1,
                            ).map((page) => (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="rounded-xl min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
                            className="rounded-xl"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
