"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BookOpen,
  Plus,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { AddWordModal } from "@/components/modals/add-word-modal";
import { useTranslation } from "@/lib/i18n-provider";
import { useToast } from "@/hooks/use-toast";
import { useCollections } from "@/hooks/use-collections";
import { useCreateWord } from "@/hooks/use-words";

interface ExtractedWord {
  term: string;
  definition: string;
  example: string;
  partOfSpeech: string;
  phonetic?: string;
  added?: boolean;
}

interface TranscriptViewerProps {
  transcript: string;
  videoTitle?: string;
}

const CEFR_LEVELS = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficient" },
];

export function TranscriptViewer({
  transcript,
  videoTitle,
}: TranscriptViewerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: collections } = useCollections();
  const addWordMutation = useCreateWord();

  // Selection states
  const [selectedText, setSelectedText] = useState("");
  const [showAddButton, setShowAddButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [openAddWordModal, setOpenAddWordModal] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // AI Extract states
  const [selectedLevel, setSelectedLevel] = useState("B1");
  const [wordCount, setWordCount] = useState(10);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  useEffect(() => {
    const updateButtonPosition = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (
        text &&
        text.length > 0 &&
        transcriptRef.current &&
        transcriptRef.current.contains(selection?.anchorNode || null)
      ) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const endRange = range.cloneRange();
          endRange.collapse(false);

          const rects = endRange.getClientRects();
          if (rects.length > 0) {
            const endRect = rects[0];
            const containerRect =
              transcriptRef.current!.getBoundingClientRect();

            setSelectedText(text);
            setButtonPosition({
              x:
                endRect.right -
                containerRect.left +
                transcriptRef.current!.scrollLeft,
              y:
                endRect.bottom -
                containerRect.top +
                transcriptRef.current!.scrollTop,
            });
            setShowAddButton(true);
          }
        }
      } else {
        setShowAddButton(false);
      }
    };

    const handleSelection = () => {
      updateButtonPosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        showAddButton &&
        !(e.target as HTMLElement).closest(".add-word-button")
      ) {
        setShowAddButton(false);
      }
    };

    const handleScroll = () => {
      if (showAddButton) {
        updateButtonPosition();
      }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);

    const transcriptContainer = transcriptRef.current;
    if (transcriptContainer) {
      transcriptContainer.addEventListener("scroll", handleScroll);
    }
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("mousedown", handleClickOutside);
      if (transcriptContainer) {
        transcriptContainer.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showAddButton]);

  const handleAddWord = () => {
    setOpenAddWordModal(true);
    setShowAddButton(false);
  };

  const handleExtractVocabulary = async () => {
    if (!transcript || transcript.length < 50) {
      setExtractError(t("youtube.transcriptTooShort"));
      return;
    }

    setIsExtracting(true);
    setExtractError("");
    setExtractedWords([]);

    try {
      const response = await fetch("/api/ai/extract-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          level: selectedLevel,
          wordCount: Math.min(wordCount, 15),
          nativeLanguage: "en", // TODO: Get from user settings
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to extract");
      }

      setExtractedWords(data.data.words.map((w: ExtractedWord) => ({ ...w, added: false })));

      toast({
        title: t("youtube.extractSuccess"),
        description: t("youtube.extractedWords", { count: data.data.words.length }),
      });
    } catch (error: any) {
      console.error("Extract error:", error);
      setExtractError(error.message || t("youtube.extractFailed"));
      toast({
        title: t("toast.error"),
        description: error.message || t("youtube.extractFailed"),
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddExtractedWord = async (word: ExtractedWord, index: number) => {
    if (!selectedCollection) {
      toast({
        title: t("toast.error"),
        description: t("youtube.selectCollectionFirst"),
        variant: "destructive",
      });
      return;
    }

    try {
      await addWordMutation.mutateAsync({
        term: word.term,
        definition: word.definition,
        example: word.example,
        partOfSpeech: word.partOfSpeech,
        phonetic: word.phonetic || "",
        collectionId: selectedCollection,
      });

      // Mark as added
      setExtractedWords((prev) =>
        prev.map((w, i) => (i === index ? { ...w, added: true } : w))
      );

      toast({
        title: t("hooks.words.wordAdded"),
        description: `"${word.term}" ${t("youtube.addedToCollection")}`,
      });
    } catch (error: any) {
      toast({
        title: t("toast.error"),
        description: error.message || t("hooks.words.failedToAdd"),
        variant: "destructive",
      });
    }
  };

  const handleAddAllWords = async () => {
    if (!selectedCollection) {
      toast({
        title: t("toast.error"),
        description: t("youtube.selectCollectionFirst"),
        variant: "destructive",
      });
      return;
    }

    const wordsToAdd = extractedWords.filter((w) => !w.added);
    let addedCount = 0;

    for (let i = 0; i < wordsToAdd.length; i++) {
      const word = wordsToAdd[i];
      try {
        await addWordMutation.mutateAsync({
          term: word.term,
          definition: word.definition,
          example: word.example,
          partOfSpeech: word.partOfSpeech,
          phonetic: word.phonetic || "",
          collectionId: selectedCollection,
        });
        addedCount++;

        // Mark as added
        setExtractedWords((prev) =>
          prev.map((w) => (w.term === word.term ? { ...w, added: true } : w))
        );
      } catch (error) {
        console.error(`Failed to add word: ${word.term}`, error);
      }
    }

    toast({
      title: t("youtube.wordsAdded"),
      description: t("youtube.addedWordsCount", { count: addedCount }),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {/* Add Word Button - Floating at selection end */}
      {showAddButton && (
        <Button
          size="sm"
          className="add-word-button absolute z-50 shadow-lg animate-in fade-in zoom-in duration-200"
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
            transform: "translate(4px, 4px)",
          }}
          onClick={handleAddWord}
        >
          <Plus className="h-3 w-3 mr-1" />
          {t("youtube.addWord")}
        </Button>
      )}

      {/* Add Word Modal */}
      <AddWordModal
        open={openAddWordModal}
        onOpenChange={setOpenAddWordModal}
        defaultTerm={selectedText}
        defaultDefinition=""
        defaultExample=""
      />

      {/* Transcript */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t("youtube.transcript")}
              {videoTitle && (
                <Badge variant="secondary" className="ml-2">
                  {videoTitle}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={transcriptRef}
              className="prose prose-sm max-w-none text-foreground leading-relaxed select-text cursor-text p-4 bg-muted/30 rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto relative"
              style={{ userSelect: "text" }}
            >
              {transcript.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Extract */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {t("youtube.aiExtract")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CEFR Level Selection */}
            <div className="space-y-2">
              <Label>{t("youtube.cefrLevel")}</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Word Count */}
            <div className="space-y-2">
              <Label>{t("youtube.wordCountLabel")}</Label>
              <Input
                type="number"
                min={1}
                max={15}
                value={wordCount}
                onChange={(e) =>
                  setWordCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))
                }
                placeholder="1-15"
              />
              <p className="text-xs text-muted-foreground">
                {t("youtube.maxWords", { max: 15 })}
              </p>
            </div>

            {/* Collection Selection */}
            <div className="space-y-2">
              <Label>{t("youtube.addToCollection")}</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("components.addWordModal.selectCollection")} />
                </SelectTrigger>
                <SelectContent>
                  {collections?.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Extract Button */}
            <Button
              onClick={handleExtractVocabulary}
              disabled={isExtracting || !transcript}
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("youtube.extracting")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("youtube.extractVocabulary")}
                </>
              )}
            </Button>

            {/* Error Message */}
            {extractError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {extractError}
              </div>
            )}

            {/* Extracted Words List */}
            {extractedWords.length > 0 && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {t("youtube.extractedWordsList")} ({extractedWords.length})
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddAllWords}
                    disabled={
                      !selectedCollection ||
                      extractedWords.every((w) => w.added)
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t("youtube.addAll")}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {extractedWords.map((word, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        word.added
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {word.term}
                            </span>
                            {word.phonetic && (
                              <span className="text-xs text-muted-foreground">
                                {word.phonetic}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {word.partOfSpeech}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {word.definition}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={word.added ? "ghost" : "outline"}
                          className="shrink-0"
                          onClick={() => handleAddExtractedWord(word, index)}
                          disabled={word.added || !selectedCollection}
                        >
                          {word.added ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {extractedWords.length === 0 && !isExtracting && !extractError && (
              <div className="text-center py-6">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("youtube.extractDescription")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
