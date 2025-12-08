"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollections } from "@/hooks/use-collections";
import { useGeneratePassage, useReadingPassages } from "@/hooks/use-reading";
import {
  DIFFICULTY_LEVELS,
  getCefrCode,
  getDifficultyFromCefr,
  getTranslationKeyFromCefr,
} from "@/lib/difficulty-levels";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { t } = useTranslation();
  const router = useRouter();
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: passages, isLoading: passagesLoading } = useReadingPassages();
  const generateMutation = useGeneratePassage();

  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [level, setLevel] = useState<string>("Intermediate");
  const [passageType, setPassageType] = useState<string>("story");
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const hasCollections = collections && collections.length > 0;
  const selectedCollectionData = collections?.find(
    (c) => c.id === selectedCollection
  );

  // Pagination logic
  const totalPages = passages ? Math.ceil(passages.length / ITEMS_PER_PAGE) : 0;
  const paginatedPassages = passages
    ? passages.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      )
    : [];

  const handleGenerate = () => {
    if (!selectedCollection) {
      return;
    }

    generateMutation.mutate({
      collectionId: selectedCollection,
      level: getCefrCode(level) as any, // Convert difficulty name to CEFR code (A1, B1, etc.)
      passageType: passageType as any,
      language,
    });
  };

  return (
    <div className="p-8 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
      <div className="relative z-10 p-6 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">{t("reading.title")}</h1>
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
                            <SelectValue placeholder={t("reading.chooseCollection")} />
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
                                    ({collection.wordCount || 0} {t("reading.words")})
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
                                    {t(`reading.difficultyLevels.${l.translationKey}.label`)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t(`reading.difficultyLevels.${l.translationKey}.description`)}
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
                                    {t(`reading.passageTypes.${type.value}.label`)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t(`reading.passageTypes.${type.value}.description`)}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("reading.language")}</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                <div className="flex items-center gap-2">
                                  <span>{lang.flag}</span>
                                  <span>{lang.name}</span>
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

              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("reading.howItWorks")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {t("reading.chooseCollectionStep", { count: 5 })}
                  </p>
                  <p>
                    {t("reading.selectDifficultyStep")}
                  </p>
                  <p>
                    {t("reading.aiGeneratesStep")}
                  </p>
                  <p>
                    {t("reading.readAnswerStep")}
                  </p>
                  <p>
                    {t("reading.trackProgressStep")}
                  </p>
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
                            className="group p-4 border-2 border-transparent hover:border-primary rounded-lg bg-card hover:bg-card/50 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
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
                                    {t(`reading.difficultyLevels.${getTranslationKeyFromCefr(passage.level)}.label`)}
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
                                        {passage._count.attempts} {t("reading.attempts", { count: passage._count.attempts })}
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
                              (_, i) => i + 1
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
