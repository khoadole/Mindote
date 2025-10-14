"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddWordModal } from "@/components/modals/add-word-modal";
import { WordCard } from "@/components/word-card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Search,
  Candy as Cards,
  CheckCircle,
} from "lucide-react";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    collections,
    words,
    getWordsByCollection,
    deleteCollection,
    deleteWord,
  } = useAppStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const collectionId = params.id as string;
  const collection = collections.find((c) => c.id === collectionId);
  const collectionWords = getWordsByCollection(collectionId);

  if (!collection) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium mb-2">Collection not found</h3>
              <p className="text-muted-foreground mb-4">
                The collection you're looking for doesn't exist.
              </p>
              <Button onClick={() => router.push("/collections")}>
                Back to Collections
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredWords = collectionWords.filter(
    (word) =>
      word.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteCollection = () => {
    if (
      confirm(
        `Are you sure you want to delete "${collection.name}"? This will remove all words from this collection.`
      )
    ) {
      deleteCollection(collection.id);
      toast({
        title: "Collection deleted",
        description: `"${collection.name}" has been deleted.`,
      });
      router.push("/collections");
    }
  };

  const handleDeleteWord = (wordId: string, wordTerm: string) => {
    if (confirm(`Are you sure you want to delete "${wordTerm}"?`)) {
      deleteWord(wordId);
      toast({
        title: "Word deleted",
        description: `"${wordTerm}" has been removed.`,
      });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/collections")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-full ${collection.color}`} />
            <h1 className="text-3xl font-bold">{collection.name}</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteCollection}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{collectionWords.length} words</Badge>
          <span className="text-sm text-muted-foreground">
            Created {new Date(collection.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Study Actions */}
        <div className="flex gap-4">
          <Button className="flex items-center gap-2">
            <Cards className="h-4 w-4" />
            Study with Flashcards
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <CheckCircle className="h-4 w-4" />
            Start Quiz
          </Button>
          <AddWordModal />
        </div>

        {/* Content */}
        <Tabs defaultValue="words" className="space-y-4">
          <TabsList>
            <TabsTrigger value="words">Words</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="words" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Words Grid */}
            {filteredWords.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <h3 className="text-lg font-medium mb-2">
                    {searchQuery ? "No words found" : "No words yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Add your first word to this collection"}
                  </p>
                  {!searchQuery && <AddWordModal />}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWords.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    onDelete={() => handleDeleteWord(word.id, word.term)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Activity tracking coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
