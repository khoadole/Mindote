"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollections } from "@/hooks/use-collections";
import { useWords } from "@/hooks/use-words";
import { useGeneratePassage, useReadingPassages } from "@/hooks/use-reading";
import { useReadingPracticeList } from "@/hooks/use-reading-practice";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Sparkles,
  Loader2,
  Clock,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Search,
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
  const [practiceSearch, setPracticeSearch] = useState("");
  const [debouncedPracticeSearch, setDebouncedPracticeSearch] = useState("");
  const [practiceSort, setPracticeSort] = useState<
    "part_asc" | "part_desc" | "updated_desc" | "updated_asc"
  >("part_asc");
  const [practicePartFilter, setPracticePartFilter] = useState<
    "all" | 1 | 2 | 3
  >("all");
  const { data: readingPracticeParts, isLoading: readingPracticeLoading } =
    useReadingPracticeList({
      search: debouncedPracticeSearch,
      sort: practiceSort,
      part: practicePartFilter,
    });
  const generateMutation = useGeneratePassage();

  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("Intermediate");
  const [passageType, setPassageType] = useState<string>("story");
  const [questionType, setQuestionType] = useState<string>("multiple-choice");
  const [contentLanguage, setContentLanguage] =
    useState<string>(DEFAULT_LANGUAGE);
  const [activeTab, setActiveTab] = useState<"ai" | "part">("part");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;
  const MAX_WORDS = 20;

  // Fetch words when collection is selected
  const { data: collectionWords, isLoading: wordsLoading } =
    useWords(selectedCollection);

  // Reset word selection when collection changes
  useEffect(() => {
    setSelectedWordIds([]);
  }, [selectedCollection]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedPracticeSearch(practiceSearch.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [practiceSearch]);

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
    <div className="px-8 pb-8 pt-4 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
      <div className="relative z-10 px-6 pb-6 pt-2 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "ai" | "part")}
            className="animate-in fade-in slide-in-from-top-2 duration-500"
          >
            <div className="inline-flex w-fit self-start rounded-xl border border-stone-300 dark:border-border bg-white/60 dark:bg-card/60 p-1">
              <TabsList className="h-10 bg-transparent p-0">
                <TabsTrigger value="part" className="px-4">
                  {t("reading.tabByPart")}
                </TabsTrigger>
                <TabsTrigger value="ai" className="px-4">
                  {t("reading.tabAi")}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          {activeTab === "ai" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generation Form */}
            <div className="lg:col-span-1 space-y-6">
              <Card
                className="border border-blue-200/60 dark:border-blue-800/30 border-b-[3px] border-b-blue-300 dark:border-b-blue-700 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.15)] hover:shadow-[0_4px_16px_-4px_rgba(59,130,246,0.25)] hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
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
              <Card className="border border-blue-200/60 dark:border-blue-800/30 border-b-[3px] border-b-blue-300 dark:border-b-blue-700 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.15)] hover:shadow-[0_4px_16px_-4px_rgba(59,130,246,0.25)] hover:-translate-y-0.5 transition-all duration-200">
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
          ) : (
            <Card className="border border-blue-200/60 dark:border-blue-800/30 border-b-[3px] border-b-blue-300 dark:border-b-blue-700 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.15)]">
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center">
                  <div className="relative w-full md:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={practiceSearch}
                      onChange={(e) => setPracticeSearch(e.target.value)}
                      placeholder={t("reading.searchPassages")}
                      className="pl-9"
                    />
                  </div>

                  <Select
                    value={String(practicePartFilter)}
                    onValueChange={(value) =>
                      setPracticePartFilter(
                        value === "all" ? "all" : (Number(value) as 1 | 2 | 3),
                      )
                    }
                  >
                    <SelectTrigger className="w-full md:w-[140px]">
                      <SelectValue placeholder="Part" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All parts</SelectItem>
                      <SelectItem value="1">Part 1</SelectItem>
                      <SelectItem value="2">Part 2</SelectItem>
                      <SelectItem value="3">Part 3</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={practiceSort}
                    onValueChange={(value) =>
                      setPracticeSort(
                        value as
                          | "part_asc"
                          | "part_desc"
                          | "updated_desc"
                          | "updated_asc",
                      )
                    }
                  >
                    <SelectTrigger className="w-full md:w-[190px]">
                      <SelectValue placeholder={t("collections.sort")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="part_asc">Part 1 -&gt; Part 3</SelectItem>
                      <SelectItem value="part_desc">Part 3 -&gt; Part 1</SelectItem>
                      <SelectItem value="updated_desc">Recently updated</SelectItem>
                      <SelectItem value="updated_asc">Least recently updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!readingPracticeLoading && (
                  <div className="text-xs text-muted-foreground">
                    {readingPracticeParts?.length || 0} result
                    {(readingPracticeParts?.length || 0) === 1 ? "" : "s"}
                  </div>
                )}

                {readingPracticeLoading ? (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    {t("common.loading")}
                  </div>
                ) : !readingPracticeParts || readingPracticeParts.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    {practiceSearch || practicePartFilter !== "all"
                      ? "No reading practice matches your filters."
                      : "No published reading practice yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                    {readingPracticeParts.map((part) => (
                      <Link
                        key={part.id}
                        href={`/reading/practice/${part.id}`}
                        className="block"
                      >
                        <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/20 p-4 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/60 hover:shadow-[0_14px_28px_-16px_rgba(37,99,235,0.35)]">
                          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%)]" />
                          <div className="relative flex items-start justify-between gap-4">
                            <div>
                              <div className="mb-2 inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                Part {part.partNumber}
                              </div>
                              <h3 className="font-semibold text-base leading-tight text-foreground/95 line-clamp-2">
                                {part.examTitle}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                                {part.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2.5">
                                {part.totalQuestions} questions • {part.estimatedMinutes} min
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {part.latestAttempt ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {part.latestAttempt.correctCount}/{part.latestAttempt.totalCount}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
