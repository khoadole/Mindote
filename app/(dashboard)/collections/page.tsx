"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  Loader2,
  Plus,
  Layers,
  BookOpen,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpAZ,
  ArrowDownAZ,
  Palette,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";
import { getDifficultyLabelKey } from "@/lib/difficulty-levels";
import { getPaginationItems, PaginationItemType } from "@/lib/pagination-utils";
import { PaginationEllipsis } from "@/components/ui/pagination";
import { getIconComponent } from "@/lib/collection-icons";

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
  const { t } = useTranslation();
  const { data: collections, isLoading } = useCollections();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [addWordModalOpen, setAddWordModalOpen] = useState(false);
  const ITEMS_PER_PAGE = 9;
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Open Add Word modal if URL has ?addWord=true
  useEffect(() => {
    if (searchParams.get("addWord") === "true") {
      setAddWordModalOpen(true);
      // Clean up URL
      router.replace("/collections", { scroll: false });
    }
  }, [searchParams, router]);

  // Fixed color options (same as create-collection-modal)
  const colorOptions = [
    { name: "Fresh Green", value: "#34D399" },
    { name: "Sunny Yellow", value: "#FBBF24" },
    { name: "Coral Orange", value: "#FB923C" },
    { name: "Soft Purple", value: "#A78BFA" },
    { name: "Sky Blue", value: "#3B82F6" },
    { name: "Hot Pink", value: "#F472B6" },
    { name: "Lime", value: "#A3E635" },
  ];

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-white dark:bg-background relative overflow-hidden transition-all duration-300">
        <div className="flex items-center gap-2 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("collections.loadingCollections")}</span>
        </div>
      </div>
    );
  }

  // Filter and sort collections
  const filteredCollections = (collections || [])
    .filter((collection) =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((collection) =>
      colorFilter ? (collection.color || "#3B82F6") === colorFilter : true
    )
    .sort((a, b) => {
      if (!sortOrder) return 0;
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

  // Pagination
  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCollections = filteredCollections.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
    setCurrentPage(1);
  };

  const handleColorFilter = (color: string | null) => {
    setColorFilter(color);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 md:p-8 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
      {/* Minimal gradient background - Light mode only - REMOVED for pure white */}
      {/* <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" /> */}

      {/* Subtle background decoration - REMOVED for pure white */}
      {/* <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-pink-200/20 dark:from-primary dark:to-primary rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-blue-200/20 dark:from-accent dark:to-accent rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div> */}

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Toolbar */}
        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both"
          style={{ animationDelay: "100ms" }}
        >
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("collections.searchCollections")}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-2 focus:border-primary/50 bg-card/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <AddWordModal
              open={addWordModalOpen}
              onOpenChange={setAddWordModalOpen}
              trigger={
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-2xl border-2 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] border-transparent transition-all hover:scale-105 shadow-lg font-semibold hover:opacity-90 h-12"
                  style={{ color: "white" }}
                  data-shortcut="add-word"
                >
                  <Plus className="h-4 w-4" />✨ {t("collections.addWord")}
                </Button>
              }
            />
            <CreateCollectionModal />
          </div>

          {/* Sort Button */}
          <Button
            variant="outline"
            onClick={handleSortToggle}
            className={`h-12 rounded-2xl border-2 flex items-center gap-2 transition-all ${
              sortOrder
                ? "bg-primary/10 border-primary/50 text-primary"
                : "bg-card/50"
            }`}
          >
            {sortOrder === "desc" ? (
              <ArrowDownAZ className="h-4 w-4" />
            ) : (
              <ArrowUpAZ className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {sortOrder === "asc"
                ? "A → Z"
                : sortOrder === "desc"
                ? "Z → A"
                : t("collections.sort")}
            </span>
          </Button>

          {/* Color Filter */}
          <div className="relative z-50 flex items-center gap-2">
            <Button
              variant="outline"
              className={`h-12 rounded-2xl border-2 flex items-center gap-2 transition-all ${
                colorFilter ? "bg-primary/10 border-primary/50" : "bg-card/50"
              }`}
              onClick={() => {
                const dropdown = document.getElementById("color-dropdown");
                dropdown?.classList.toggle("hidden");
              }}
            >
              {colorFilter ? (
                <div
                  className="w-4 h-4 rounded-full border border-white/50"
                  style={{ backgroundColor: colorFilter }}
                />
              ) : (
                <Palette className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {t("collections.filterByColor")}
              </span>
            </Button>

            {colorFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleColorFilter(null)}
                className="h-8 w-8 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            )}

            {/* Color Dropdown */}
            <div
              id="color-dropdown"
              className="hidden absolute bottom-14 left-0 z-[9999] bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-3 min-w-[200px]"
            >
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      handleColorFilter(color.value);
                      document
                        .getElementById("color-dropdown")
                        ?.classList.add("hidden");
                    }}
                    className={`w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 ${
                      colorFilter === color.value
                        ? "ring-2 ring-primary ring-offset-2"
                        : "border-white/30"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <Card className="border-2 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30 shadow-lg">
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center mb-6 animate-float">
                <Layers className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 justify-center">
                <Layers className="h-5 w-5 text-primary" />
                {t("collections.noCollectionsFound")}
              </h3>
              <p className="text-muted-foreground mb-8">
                {searchQuery
                  ? t("collections.tryAdjustingSearch")
                  : t("collections.createFirstCollectionPrompt")}
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCollections.map((collection, index) => {
                const wordCount = collection.wordCount || 0;
                const masteryPercent = Math.min((wordCount / 50) * 100, 100); // Assume 50 words = 100%

                const isHex = collection.color?.startsWith("#");
                const color = collection.color || "#3B82F6";
                const colorClass = !isHex
                  ? collection.color || "bg-primary"
                  : "";
                const textClass = !isHex
                  ? colorClass.replace("bg-", "text-")
                  : "";
                const borderClass = !isHex
                  ? colorClass.replace("bg-", "border-")
                  : "";

                return (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.id}`}
                  >
                    <Card
                      className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both h-full border-0 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group overflow-hidden relative rounded-3xl"
                    >
                      {/* Gradient Background */}
                      <div 
                        className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity rounded-3xl"
                        style={{ 
                          background: isHex 
                            ? `linear-gradient(135deg, ${color}dd 0%, ${color}88 100%)`
                            : undefined 
                        }}
                      />
                      
                      {/* Decorative circles */}
                      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                      <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
                      
                      <CardHeader className="relative z-10 pb-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div
                            className="h-14 w-14 rounded-xl shrink-0 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-white/95 dark:bg-gray-900/95"
                          >
                            {(() => {
                              const CollectionIcon = getIconComponent(
                                collection.icon || "Layers"
                              );
                              return (
                                <CollectionIcon 
                                  className="h-7 w-7" 
                                  style={{ color: isHex ? color : undefined }}
                                />
                              );
                            })()}
                          </div>
                          {collection.difficultyLevel && (
                            <Badge
                              variant="secondary"
                              className="bg-white/95 text-gray-900 dark:bg-gray-900/95 dark:text-white shadow-md border-0 font-semibold"
                            >
                              {t(
                                getDifficultyLabelKey(
                                  collection.difficultyLevel
                                )
                              )}
                            </Badge>
                          )}
                        </div>
                        <CardTitle
                          className="text-lg font-bold drop-shadow-sm line-clamp-2 min-h-[3rem] text-gray-900 dark:text-white"
                        >
                          {collection.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 pt-0">
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                          <BookOpen className="h-4 w-4" style={{ color: isHex ? color : undefined }} />
                          <div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              {wordCount}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1.5">
                              {t("collections.wordsLabel")}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] flex items-center gap-1 mt-2 text-gray-700 dark:text-white/70">
                          <TrendingUp className="h-3 w-3" />
                          {t("collections.created")}{" "}
                          {new Date(collection.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
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
                  <span className="hidden sm:inline">
                    {t("collections.previous")}
                  </span>
                </Button>

                <div className="flex items-center gap-1">
                  {getPaginationItems(currentPage, totalPages).map(
                    (page, index) => {
                      if (page === "ellipsis") {
                        return <PaginationEllipsis key={`ellipsis-${index}`} />;
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className={`rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                            currentPage === page
                              ? "bg-primary text-primary-foreground"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
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
                  <span className="hidden sm:inline">
                    {t("collections.next")}
                  </span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
