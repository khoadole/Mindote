"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollections } from "@/hooks/use-collections";
import { useGeneratePassage, useReadingPassages } from "@/hooks/use-reading";
import {
  DIFFICULTY_LEVELS,
  getCefrCode,
  getDifficultyFromCefr,
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
    <div className="relative min-h-screen">
      {/* Minimal gradient background - Light mode only */}
      <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />

      {/* Subtle floating shapes - Light mode only */}
      <div className="absolute inset-0 pointer-events-none dark:hidden">
        {/* Modern mesh gradient - very trendy in 2024/2025 */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
        radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
        radial-gradient(at 50% 0%, rgba(236, 72, 153, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(251, 146, 60, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.15) 0px, transparent 50%)
      `,
          }}
        />

        {/* Subtle animated orbs */}
        <div
          className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-blue-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "7s", animationDelay: "1s" }}
        />
      </div>
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-pink-200/20 dark:from-primary dark:to-primary rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-blue-200/20 dark:from-accent dark:to-accent rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content - positioned above background */}
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
              Back
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Reading Practice</h1>
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
                    Generate Passage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!hasCollections ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        You need to create a collection with words first
                      </p>
                      <Button onClick={() => router.push("/collections")}>
                        Go to Collections
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Select Collection</Label>
                        <Select
                          value={selectedCollection}
                          onValueChange={setSelectedCollection}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a collection" />
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
                                    ({collection.wordCount || 0} words)
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCollectionData &&
                          (selectedCollectionData.wordCount || 0) < 5 && (
                            <p className="text-sm text-destructive">
                              This collection needs at least 5 words to generate
                              a passage
                            </p>
                          )}
                      </div>

                      <div className="space-y-2">
                        <Label>Difficulty Level</Label>
                        <Select value={level} onValueChange={setLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTY_LEVELS.map((l) => (
                              <SelectItem key={l.value} value={l.value}>
                                <div>
                                  <div className="font-medium">{l.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {l.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Passage Type</Label>
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
                                    {type.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {type.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Language</Label>
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
                          Language for the reading passage content
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
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Passage
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        AI will create a passage using your vocabulary words
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">How it works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    📚 <strong>1. Choose a collection</strong> with at least 5
                    words
                  </p>
                  <p>
                    🎯 <strong>2. Select difficulty</strong> level (A1-C2)
                  </p>
                  <p>
                    ✨ <strong>3. AI generates</strong> a passage using your
                    words
                  </p>
                  <p>
                    📖 <strong>4. Read & answer</strong> comprehension questions
                  </p>
                  <p>
                    🎉 <strong>5. Track your progress</strong> and improve!
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
                    Your Reading Passages
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
                        No reading passages yet
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Generate your first reading passage to start practicing!
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
                                    {getDifficultyFromCefr(passage.level)}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {passage.wordCount} words
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {passage.estimatedTime} min
                                  </span>
                                  {passage._count &&
                                    passage._count.attempts > 0 && (
                                      <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {passage._count.attempts} attempt
                                        {passage._count.attempts > 1 ? "s" : ""}
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
                                Read →
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
