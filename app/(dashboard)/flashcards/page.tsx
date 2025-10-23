"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useAllWords } from "@/hooks/use-words";
import { useCollections, useCollection } from "@/hooks/use-collections";
import { useDueWords, useDueWordsByCollection } from "@/hooks/use-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Candy as Cards, Play, ArrowLeft, Loader2, Flame } from "lucide-react";

// ✅ Lazy load FlashcardPlayer - only load when user starts studying
const FlashcardPlayer = dynamic(
  () =>
    import("@/components/flashcard-player").then((mod) => ({
      default: mod.FlashcardPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading flashcard player...</span>
        </div>
      </div>
    ),
  }
);

export default function FlashcardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // 'review' or null (all words)
  const collectionParam = searchParams.get("collection"); // specific collection ID

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const { data: words = [], isLoading: wordsLoading } = useAllWords();
  const { data: collections = [], isLoading: collectionsLoading } =
    useCollections();
  const { data: specificCollection } = useCollection(collectionParam || "");
  const { data: dueWords = [], isLoading: dueLoading } = useDueWords();
  const { data: collectionDueWords = [] } =
    useDueWordsByCollection(collectionParam);
  const { toast } = useToast();

  const [selectedScope, setSelectedScope] = useState<string>(
    collectionParam || "all"
  );
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [isStudying, setIsStudying] = useState(false);

  const isLoading =
    wordsLoading || collectionsLoading || (mode === "review" && dueLoading);

  // Set scope based on URL params
  useEffect(() => {
    if (collectionParam) {
      setSelectedScope(collectionParam);
    }
  }, [collectionParam]);

  // Auto-start if mode=review
  useEffect(() => {
    if (mode === "review" && dueWords.length > 0 && !isStudying) {
      setIsStudying(true);
    }
  }, [mode, dueWords, isStudying]);

  const getStudyWords = () => {
    // Review mode - only due words
    if (mode === "review") {
      // If specific collection, get due words for that collection
      if (collectionParam) {
        return collectionDueWords;
      }
      // Otherwise get all due words
      return dueWords;
    }

    // Normal mode - filter by scope
    if (!words) return [];
    if (selectedScope === "all") {
      return words;
    }
    return words.filter((word) => word.collectionId === selectedScope);
  };

  const studyWords = getStudyWords();

  const handleStartStudy = () => {
    if (studyWords.length === 0) {
      toast({
        title: "No words to study",
        description: "Please add some words or select a different collection.",
        variant: "destructive",
      });
      return;
    }
    setIsStudying(true);
  };

  const handleStudyComplete = (results: { correct: number; again: number }) => {
    toast({
      title: "Study session complete!",
      description: `You got ${results.correct} words right and ${results.again} need more review.`,
    });

    // If in review mode, go back to dashboard or collection
    if (mode === "review") {
      if (collectionParam) {
        router.push(`/collections/${collectionParam}`);
      } else {
        router.push("/dashboard");
      }
    } else {
      setIsStudying(false);
    }
  };

  const handleExit = () => {
    // If in review mode, go back to dashboard or collection
    if (mode === "review") {
      if (collectionParam) {
        router.push(`/collections/${collectionParam}`);
      } else {
        router.push("/dashboard");
      }
    } else {
      setIsStudying(false);
    }
  }; // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading flashcards...</span>
        </div>
      </div>
    );
  }

  if (isStudying) {
    return (
      <div className="p-6">
        <FlashcardPlayer
          words={studyWords as any}
          onComplete={handleStudyComplete}
          onExit={handleExit}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (collectionParam) {
                router.push(`/collections/${collectionParam}`);
              } else {
                router.push("/dashboard");
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {mode === "review" ? (
              <>
                <Flame className="h-6 w-6 text-orange-500" />
                <h1 className="text-3xl font-bold">
                  {collectionParam && specificCollection
                    ? `Review: ${specificCollection.name}`
                    : "Review Session"}
                </h1>
                <span className="text-sm text-muted-foreground">
                  ({(collectionParam ? collectionDueWords : dueWords).length}{" "}
                  due words)
                </span>
              </>
            ) : (
              <>
                <Cards className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">
                  {collectionParam && specificCollection
                    ? `Flashcards: ${specificCollection.name}`
                    : "Flashcards"}
                </h1>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings */}
          <div
            className="lg:col-span-1 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
            style={{ animationDelay: "100ms" }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>
                  {mode === "review" ? "Review Settings" : "Study Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode !== "review" && !collectionParam && (
                  <div className="space-y-2">
                    <Label htmlFor="scope">Study Scope</Label>
                    <Select
                      value={selectedScope}
                      onValueChange={setSelectedScope}
                    >
                      <SelectTrigger className="truncate">
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Words ({words?.length || 0})
                        </SelectItem>
                        {collections?.map((collection) => (
                          <SelectItem
                            key={collection.id}
                            value={collection.id}
                            className="truncate"
                          >
                            <span
                              className="truncate block"
                              title={collection.name}
                            >
                              {collection.name} (
                              {words?.filter(
                                (w) => w.collectionId === collection.id
                              ).length || 0}
                              )
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="shuffle"
                    checked={shuffleEnabled}
                    onCheckedChange={setShuffleEnabled}
                  />
                  <Label htmlFor="shuffle">Shuffle cards</Label>
                </div>

                <Button
                  onClick={handleStartStudy}
                  className="w-full hover:scale-105 transition-transform"
                  disabled={studyWords.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {mode === "review" ? "Start Review" : "Start Study Session"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div
            className="lg:col-span-2 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
            style={{ animationDelay: "200ms" }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {studyWords.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
                      <Cards className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        Ready to Study
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {studyWords.length} cards ready for your study session
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {studyWords.slice(0, 5).map((word) => (
                          <span
                            key={word.id}
                            className="px-2 py-1 bg-muted rounded text-sm truncate max-w-[150px]"
                            title={word.term}
                          >
                            {word.term}
                          </span>
                        ))}
                        {studyWords.length > 5 && (
                          <span className="px-2 py-1 bg-muted rounded text-sm">
                            +{studyWords.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {studyWords.length}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total Cards
                        </p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-accent">
                          {Math.ceil(studyWords.length * 2.5)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Est. Minutes
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Cards className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Words Available
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedScope === "all"
                        ? "Add some words to your vocabulary to start studying"
                        : "This collection doesn't have any words yet"}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/collections")}
                    >
                      Go to Collections
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
