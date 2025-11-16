"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCollectionKeyboardShortcuts } from "@/lib/collection-keyboard-shortcuts";
import { useCollection } from "@/hooks/use-collections";
import { useDeleteCollection } from "@/hooks/use-collections";
import { useDeleteWord } from "@/hooks/use-words";
import { useDueWordsByCollection } from "@/hooks/use-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordCard } from "@/components/word-card";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Search,
  Candy as Cards,
  CheckCircle,
  Loader2,
  Flame,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ✅ Lazy load AddWordModal
const AddWordModal = dynamic(
  () =>
    import("@/components/modals/add-word-modal").then((mod) => ({
      default: mod.AddWordModal,
    })),
  { ssr: false }
);

// ✅ Lazy load RenameCollectionModal
const RenameCollectionModal = dynamic(
  () =>
    import("@/components/modals/rename-collection-modal").then((mod) => ({
      default: mod.RenameCollectionModal,
    })),
  { ssr: false }
);

// ✅ Lazy load DeleteConfirmationModal
const DeleteConfirmationModal = dynamic(
  () =>
    import("@/components/modals/delete-confirmation-modal").then((mod) => ({
      default: mod.DeleteConfirmationModal,
    })),
  { ssr: false }
);

// ✅ Lazy load EditWordModal
const EditWordModal = dynamic(
  () =>
    import("@/components/modals/edit-word-modal").then((mod) => ({
      default: mod.EditWordModal,
    })),
  { ssr: false }
);

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  // Enable collection-specific keyboard shortcuts
  useCollectionKeyboardShortcuts(collectionId);

  const { data: collection, isLoading } = useCollection(collectionId);
  const { data: dueWords = [] } = useDueWordsByCollection(collectionId);
  const deleteCollectionMutation = useDeleteCollection();
  const deleteWordMutation = useDeleteWord();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Get collection words for type inference
  const collectionWords = collection?.words || [];

  // Delete modals state
  const [deleteCollectionOpen, setDeleteCollectionOpen] = useState(false);
  const [deleteWordOpen, setDeleteWordOpen] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<{
    id: string;
    term: string;
  } | null>(null);

  // Edit word state
  const [editWordOpen, setEditWordOpen] = useState(false);
  const [wordToEdit, setWordToEdit] = useState<
    (typeof collectionWords)[number] | null
  >(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading collection...</span>
        </div>
      </div>
    );
  }

  // Not found state
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

  const dueWordsCount = dueWords.length;
  const filteredWords = collectionWords.filter(
    (word) =>
      word.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWords = filteredWords.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDeleteCollection = () => {
    setDeleteCollectionOpen(true);
  };

  const handleConfirmDeleteCollection = () => {
    deleteCollectionMutation.mutate(collection.id, {
      onSuccess: () => {
        router.push("/collections");
      },
    });
  };

  const handleDeleteWord = (wordId: string, wordTerm: string) => {
    setWordToDelete({ id: wordId, term: wordTerm });
    setDeleteWordOpen(true);
  };

  const handleConfirmDeleteWord = () => {
    if (wordToDelete) {
      deleteWordMutation.mutate(wordToDelete.id);
    }
  };

  const handleEditWord = (word: (typeof collectionWords)[number]) => {
    setWordToEdit(word);
    setEditWordOpen(true);
  };

  return (
        <div className="p-6 bg-white dark:bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/collections")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`h-4 w-4 rounded-full shrink-0 ${collection.color}`}
            />
            <h1 className="text-3xl font-bold truncate">{collection.name}</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <RenameCollectionModal
              collectionId={collection.id}
              currentName={collection.name}
            />
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
        <div
          className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both"
          style={{ animationDelay: "100ms" }}
        >
          <Badge variant="secondary">{collectionWords.length} words</Badge>
          {dueWordsCount > 0 && (
            <Badge
              variant="outline"
              className="text-orange-500 border-orange-500"
            >
              <Flame className="h-3 w-3 mr-1" />
              {dueWordsCount} due
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            Created {new Date(collection.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Study Actions */}
        <div
          className="flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both"
          style={{ animationDelay: "200ms" }}
        >
          <Link href={`/flashcards?collection=${collectionId}`}>
            <Button
              className="flex items-center gap-2 hover:scale-105 transition-transform"
              disabled={collectionWords.length === 0}
            >
              <Cards className="h-4 w-4" />
              Study with Flashcards
              {collectionWords.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-white/20">
                  {collectionWords.length}
                </Badge>
              )}
            </Button>
          </Link>

          {dueWordsCount > 0 && (
            <Link href={`/flashcards?mode=review&collection=${collectionId}`}>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:scale-105 transition-transform"
              >
                <Flame className="h-4 w-4 text-orange-500" />
                Review Due Words
                <Badge
                  variant="secondary"
                  className="ml-1 bg-orange-500 text-white"
                >
                  {dueWordsCount}
                </Badge>
              </Button>
            </Link>
          )}

          <Link href={`/quiz?collection=${collectionId}`}>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent hover:scale-105 transition-transform"
              disabled={collectionWords.length === 0}
            >
              <CheckCircle className="h-4 w-4" />
              Start Quiz
              {collectionWords.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {collectionWords.length}
                </Badge>
              )}
            </Button>
          </Link>

          <AddWordModal
            collectionId={collectionId}
            trigger={
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent hover:scale-105 transition-transform"
                data-shortcut="add-word"
              >
                <Plus className="h-4 w-4" />✨ Add Word
              </Button>
            }
          />
        </div>

        {/* Content */}
        <Tabs
          defaultValue="words"
          className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "300ms" }}
        >
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
                onChange={(e) => handleSearchChange(e.target.value)}
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
                  {!searchQuery && <AddWordModal collectionId={collectionId} />}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedWords.map((word, index) => (
                    <div
                      key={word.id}
                      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                      style={{
                        animationDelay: `${index * 30}ms`,
                        animationDuration: "400ms",
                      }}
                    >
                      <WordCard
                        word={{
                          ...word,
                          partOfSpeech: word.partOfSpeech ?? undefined,
                          example: word.example ?? undefined,
                          phonetic: word.phonetic ?? undefined,
                          collection: {
                            id: collection.id,
                            name: collection.name,
                            color: collection.color || "bg-primary",
                          },
                        }}
                        onEdit={() => handleEditWord(word)}
                        onDelete={() => handleDeleteWord(word.id, word.term)}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="rounded-xl min-w-[40px]"
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-xl"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
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

      {/* Delete Collection Modal */}
      <DeleteConfirmationModal
        open={deleteCollectionOpen}
        onOpenChange={setDeleteCollectionOpen}
        onConfirm={handleConfirmDeleteCollection}
        title="Delete Collection"
        description="This will permanently delete this collection and all its words. This action cannot be undone."
        itemName={collection.name}
        isPending={deleteCollectionMutation.isPending}
      />

      {/* Delete Word Modal */}
      <DeleteConfirmationModal
        open={deleteWordOpen}
        onOpenChange={(open) => {
          setDeleteWordOpen(open);
          if (!open) setWordToDelete(null);
        }}
        onConfirm={handleConfirmDeleteWord}
        title="Delete Word"
        description="Are you sure you want to delete this word? This action cannot be undone."
        itemName={wordToDelete?.term}
        isPending={deleteWordMutation.isPending}
      />

      {/* Edit Word Modal */}
      <EditWordModal
        word={wordToEdit}
        open={editWordOpen}
        onOpenChange={(open) => {
          setEditWordOpen(open);
          if (!open) setWordToEdit(null);
        }}
      />
    </div>
  );
}
