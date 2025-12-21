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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Filter,
  ArrowUpDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n-provider";
import { getPaginationItems, PaginationItemType } from "@/lib/pagination-utils";
import { PaginationEllipsis } from "@/components/ui/pagination";

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
  const { t } = useTranslation();

  // Enable collection-specific keyboard shortcuts
  useCollectionKeyboardShortcuts(collectionId);

  const { data: collection, isLoading } = useCollection(collectionId);
  const { data: dueWords = [] } = useDueWordsByCollection(collectionId);
  const deleteCollectionMutation = useDeleteCollection();
  const deleteWordMutation = useDeleteWord();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
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
      <div className="p-6 flex items-center justify-center min-h-screen bg-white dark:bg-background relative overflow-hidden transition-all duration-300">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("collections.loadingCollection")}</span>
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
              <h3 className="text-lg font-medium mb-2">{t("collections.collectionNotFound")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("collections.collectionNotFoundDescription")}
              </p>
              <Button onClick={() => router.push("/collections")}>
                {t("collections.backToCollections")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const dueWordsCount = dueWords.length;
  
  // Filter and sort words
  const filteredWords = collectionWords
    .filter((word) => {
      const matchesSearch =
        word.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterType === "all" ||
        (filterType === "custom" && (!word.partOfSpeech || ![
          "noun", "pronoun", "verb", "adjective", 
          "adverb", "preposition", "conjunction", "interjection"
        ].includes(word.partOfSpeech.toLowerCase()))) ||
        word.partOfSpeech?.toLowerCase() === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "az":
          return a.term.localeCompare(b.term);
        case "za":
          return b.term.localeCompare(a.term);
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWords = filteredWords.slice(startIndex, endIndex);

  // Reset to page 1 when search/filter/sort changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
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
        <div className="p-4 md:p-6 bg-white dark:bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/collections")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("collections.back")}
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={`h-4 w-4 rounded-full shrink-0 ${
                  !collection.color?.startsWith("#") ? collection.color : ""
                }`}
                style={collection.color?.startsWith("#") ? { backgroundColor: collection.color } : undefined}
              />
              <h1 className="text-2xl md:text-3xl font-bold truncate">{collection.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto w-full md:w-auto justify-end">
            <RenameCollectionModal
              collectionId={collection.id}
              currentName={collection.name}
              currentColor={collection.color}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteCollection}
              className="bg-destructive/10 hover:bg-destructive/20 text-destructive dark:bg-destructive/20 dark:hover:bg-destructive/30 rounded-full border-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("collections.delete")}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div
          className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both"
          style={{ animationDelay: "100ms" }}
        >
          <Badge variant="secondary">{collectionWords.length} {t("collections.wordsLabel")}</Badge>
          {dueWordsCount > 0 && (
            <Badge
              variant="outline"
              className="text-orange-500 border-orange-500"
            >
              <Flame className="h-3 w-3 mr-1" />
              {dueWordsCount} {t("collections.due")}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {t("collections.created")} {new Date(collection.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Study Actions */}
        <div
          className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both"
          style={{ animationDelay: "200ms" }}
        >
          <Link href={`/flashcards?collection=${collectionId}`}>
            <Button
              className="flex items-center gap-2 hover:scale-105 transition-transform"
              disabled={collectionWords.length === 0}
            >
              <Cards className="h-4 w-4" />
              {t("collections.studyWithFlashcards")}
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
                {t("collections.reviewDueWords")}
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
              {t("collections.startQuiz")}
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
                variant="default"
                className="flex items-center gap-2 rounded-full hover:scale-105 transition-transform"
                data-shortcut="add-word"
              >
                <Plus className="h-4 w-4" />✨ {t("collections.addWord")}
              </Button>
            }
          />
        </div>

        {/* Content */}
        <div
          className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "300ms" }}
        >
          {/* Search, Filter & Sort Bar */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("collections.searchWords")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Dropdown */}
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={t("collections.filter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("collections.filterAll")}</SelectItem>
                <SelectItem value="noun">{t("collections.filterNoun")}</SelectItem>
                <SelectItem value="pronoun">{t("collections.filterPronoun")}</SelectItem>
                <SelectItem value="verb">{t("collections.filterVerb")}</SelectItem>
                <SelectItem value="adjective">{t("collections.filterAdjective")}</SelectItem>
                <SelectItem value="adverb">{t("collections.filterAdverb")}</SelectItem>
                <SelectItem value="preposition">{t("collections.filterPreposition")}</SelectItem>
                <SelectItem value="conjunction">{t("collections.filterConjunction")}</SelectItem>
                <SelectItem value="interjection">{t("collections.filterInterjection")}</SelectItem>
                <SelectItem value="custom">{t("collections.filterCustom")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={t("collections.sort")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("collections.sortNewest")}</SelectItem>
                <SelectItem value="oldest">{t("collections.sortOldest")}</SelectItem>
                <SelectItem value="az">{t("collections.sortAZ")}</SelectItem>
                <SelectItem value="za">{t("collections.sortZA")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Words Grid */}
          {filteredWords.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery || filterType !== "all" ? t("collections.noWordsFound") : t("collections.noWordsYet")}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || filterType !== "all"
                    ? t("collections.clearSearch")
                    : t("collections.startAdding")}
                </p>
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
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 w-8 h-8 p-0 sm:w-auto sm:h-auto sm:px-4 sm:py-2"
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t("collections.previous")}</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPaginationItems(currentPage, totalPages).map(
                      (page, index) => {
                        if (page === 'ellipsis') {
                          return (
                            <PaginationEllipsis key={`ellipsis-${index}`} />
                          );
                        }

                        return (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                            className={`rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${currentPage === page ? "bg-primary text-primary-foreground" : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                          >
                            {page}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 w-8 h-8 p-0 sm:w-auto sm:h-auto sm:px-4 sm:py-2"
                  >
                    <span className="hidden sm:inline">{t("collections.next")}</span>
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Collection Modal */}
      <DeleteConfirmationModal
        open={deleteCollectionOpen}
        onOpenChange={setDeleteCollectionOpen}
        onConfirm={handleConfirmDeleteCollection}
        title={t("collections.deleteCollection")}
        description={t("collections.deleteCollectionConfirmation")}
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
        title={t("collections.deleteWord")}
        description={t("collections.deleteWordConfirmation")}
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
