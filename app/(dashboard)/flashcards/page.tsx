"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
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
import { FlashcardPlayer } from "@/components/flashcard-player";
import { useToast } from "@/hooks/use-toast";
import { Candy as Cards, Play, ArrowLeft } from "lucide-react";

export default function FlashcardsPage() {
  const router = useRouter();
  const { words, collections } = useAppStore();
  const { toast } = useToast();

  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [isStudying, setIsStudying] = useState(false);

  const getStudyWords = () => {
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
    setIsStudying(false);
  };

  const handleExit = () => {
    setIsStudying(false);
  };

  if (isStudying) {
    return (
      <div className="p-6">
        <FlashcardPlayer
          words={studyWords}
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Cards className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Flashcards</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Study Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scope">Study Scope</Label>
                  <Select
                    value={selectedScope}
                    onValueChange={setSelectedScope}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Words ({words.length})
                      </SelectItem>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name} (
                          {
                            words.filter(
                              (w) => w.collectionId === collection.id
                            ).length
                          }
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                  className="w-full"
                  disabled={studyWords.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Study Session
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card>
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
                            className="px-2 py-1 bg-muted rounded text-sm"
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
