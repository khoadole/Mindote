"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useCollections } from "@/hooks/use-collections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientCard } from "@/components/ui/gradient-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Loader2,
  Plus,
  Layers,
  BookOpen,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ✅ Lazy load modals
const AddWordModal = dynamic(
  () =>
    import("@/components/modals/add-word-modal").then((mod) => ({
      default: mod.AddWordModal,
    })),
  { ssr: false }
);

const CreateCollectionModal = dynamic(
  () =>
    import("@/components/modals/create-collection-modal").then((mod) => ({
      default: mod.CreateCollectionModal,
    })),
  { ssr: false }
);

export default function CollectionsPage() {
  const { data: collections, isLoading } = useCollections();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
        <div className="flex items-center gap-2 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading collections...</span>
        </div>
      </div>
    );
  }

  const filteredCollections = (collections || []).filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCollections = filteredCollections.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-8 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />

      {/* Enhanced animated background decoration with patterns - Light mode only */}
      {/* <div className="absolute inset-0 pointer-events-none dark:hidden">
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

        <div
          className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-blue-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "7s", animationDelay: "1s" }}
        />
      </div> */}
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-pink-200/20 dark:from-primary dark:to-primary rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-blue-200/20 dark:from-accent dark:to-accent rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Collections
            </h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Organize your vocabulary by topics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AddWordModal
              trigger={
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-2xl border-2 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-transparent dark:to-transparent border-transparent dark:border-border text-white dark:text-foreground hover:from-purple-600 hover:to-pink-600 dark:hover:border-primary dark:hover:bg-primary/5 transition-all hover:scale-105 shadow-lg dark:shadow-sm font-semibold"
                  data-shortcut="add-word"
                >
                  <Plus className="h-4 w-4" />✨ Add Word
                </Button>
              }
            />
            <CreateCollectionModal />
          </div>
        </div>

        {/* Toolbar */}
        <div
          className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both"
          style={{ animationDelay: "100ms" }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-2 focus:border-primary/50 bg-card/50"
            />
          </div>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <GradientCard gradient="purple" hoverable={false}>
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center mb-6 animate-float">
                <Layers className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No collections found
              </h3>
              <p className="text-muted-foreground mb-8">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Create your first collection to get started"}
              </p>
              <CreateCollectionModal />
            </div>
          </GradientCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCollections.map((collection, index) => {
                const gradients = [
                  "purple",
                  "green",
                  "orange",
                  "pink",
                ] as const;
                const gradient = gradients[index % gradients.length];
                const wordCount = collection.wordCount || 0;
                const masteryPercent = Math.min((wordCount / 50) * 100, 100); // Assume 50 words = 100%

                return (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.id}`}
                  >
                    <GradientCard
                      gradient={gradient}
                      className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both h-full"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div
                            className={`h-14 w-14 rounded-2xl shrink-0 flex items-center justify-center bg-white/20 dark:bg-primary backdrop-blur-sm shadow-lg`}
                          >
                            <Layers className="h-7 w-7 text-white" />
                          </div>
                          <ProgressRing
                            progress={masteryPercent}
                            size={56}
                            strokeWidth={4}
                            showPercentage={false}
                          />
                        </div>
                        <CardTitle className="text-xl truncate text-white dark:text-card-foreground">
                          {collection.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-white/90 dark:text-muted-foreground" />
                            <span className="text-2xl font-bold text-white dark:text-foreground">
                              {wordCount}
                            </span>
                            <span className="text-sm text-white/80 dark:text-muted-foreground">
                              words
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-white/20 dark:bg-secondary text-white dark:text-secondary-foreground border-white/30 dark:border-border backdrop-blur-sm"
                          >
                            {Math.round(masteryPercent)}% mastered
                          </Badge>
                        </div>

                        <p className="text-xs text-white/70 dark:text-muted-foreground mb-4 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Created{" "}
                          {new Date(collection.createdAt).toLocaleDateString()}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 rounded-xl bg-white dark:bg-gradient-to-r dark:from-primary dark:to-accent text-purple-700 dark:text-white font-bold shadow-md hover:shadow-xl transition-all hover:scale-110 hover:bg-white border-2 border-white/50"
                          >
                            Study
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-xl border-2 border-white dark:border-border bg-white/10 dark:bg-transparent text-white dark:text-foreground font-semibold hover:bg-white hover:text-purple-700 dark:hover:bg-primary/10 dark:hover:text-white transition-all hover:scale-110 backdrop-blur-sm shadow-md hover:shadow-xl"
                          >
                            Quiz
                          </Button>
                        </div>
                      </CardContent>
                    </GradientCard>
                  </Link>
                );
              })}
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
                        variant={currentPage === page ? "default" : "outline"}
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
      </div>
    </div>
  );
}
