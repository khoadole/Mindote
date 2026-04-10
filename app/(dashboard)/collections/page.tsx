"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useCollections } from "@/hooks/use-collections";
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
import { getPaginationItems } from "@/lib/pagination-utils";
import { PaginationEllipsis } from "@/components/ui/pagination";
import { getIconComponent } from "@/lib/collection-icons";

// ✅ Lazy load modals
const AddWordModal = dynamic(
  () =>
    import("@/components/modals/add-word-modal").then((mod) => ({
      default: mod.AddWordModal,
    })),
  { ssr: false },
);

const CreateCollectionModal = dynamic(
  () =>
    import("@/components/modals/create-collection-modal").then((mod) => ({
      default: mod.CreateCollectionModal,
    })),
  { ssr: false },
);

export default function CollectionsPage() {
  const { t } = useTranslation();
  const { data: collections, isLoading } = useCollections();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [addWordModalOpen, setAddWordModalOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const ITEMS_PER_PAGE = 9;

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("addWord") === "true") {
      setAddWordModalOpen(true);
      router.replace("/collections", { scroll: false });
    }
  }, [searchParams, router]);

  const colorOptions = [
    { name: "Sky Blue", value: "#3B82F6" },
    { name: "Fresh Green", value: "#34D399" },
    { name: "Sunny Yellow", value: "#FBBF24" },
    { name: "Coral Orange", value: "#FB923C" },
    { name: "Soft Purple", value: "#A78BFA" },
    { name: "Hot Pink", value: "#F472B6" },
    { name: "Lime", value: "#A3E635" },
  ];

  useKeyboardShortcuts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const filteredCollections = (collections || [])
    .filter((collection) =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((collection) =>
      colorFilter ? (collection.color || "#3B82F6") === colorFilter : true,
    )
    .sort((a, b) => {
      if (!sortOrder) return 0;
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCollections = filteredCollections.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

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
    setColorDropdownOpen(false);
    setCurrentPage(1);
  };

  const totalWords = (collections || []).reduce(
    (sum, c) => sum + (c.wordCount || 0),
    0,
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50/70 dark:bg-background min-h-screen transition-all duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-top-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2.5 text-gray-700 dark:text-white">
            <Layers className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            {t("collections.title") || "Bộ sưu tập"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {(collections || []).length}{" "}
            {t("sidebar.collections") || "bộ sưu tập"} • {totalWords}{" "}
            {t("collections.wordsLabel") || "từ"}
          </p>
        </div>

        {/* Toolbar */}
        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in slide-in-from-top-4 relative z-20"
          style={{ animationDelay: "50ms" }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t("collections.searchCollections")}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-10 bg-white/80 dark:bg-gray-900 border-gray-200/80 dark:border-gray-800 rounded-lg focus:border-blue-200 dark:focus:border-blue-700"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Sort */}
            <Button
              variant="outline"
              onClick={handleSortToggle}
              size="sm"
              className={`h-10 rounded-lg border flex items-center gap-1.5 transition-all border-b-[2px] ${
                sortOrder
                  ? "bg-blue-50/60 border-blue-200/80 border-b-blue-400 text-blue-500 dark:bg-blue-900/20 dark:border-blue-800 dark:border-b-blue-600 dark:text-blue-400"
                  : "bg-white/80 dark:bg-gray-900 border-gray-200/80 border-b-gray-300 dark:border-gray-800 dark:border-b-gray-600"
              }`}
            >
              {sortOrder === "desc" ? (
                <ArrowDownAZ className="h-4 w-4" />
              ) : (
                <ArrowUpAZ className="h-4 w-4" />
              )}
              <span className="hidden sm:inline text-sm">
                {sortOrder === "asc"
                  ? "A → Z"
                  : sortOrder === "desc"
                    ? "Z → A"
                    : t("collections.sort")}
              </span>
            </Button>

            {/* Color Filter */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={`h-10 rounded-lg border flex items-center gap-1.5 transition-all border-b-[2px] ${
                  colorFilter
                    ? "bg-blue-50/60 border-blue-200/80 border-b-blue-400 text-blue-500 dark:bg-blue-900/20 dark:border-blue-800 dark:border-b-blue-600 dark:text-blue-400"
                    : "bg-white/80 dark:bg-gray-900 border-gray-200/80 border-b-gray-300 dark:border-gray-800 dark:border-b-gray-600"
                }`}
                onClick={() => setColorDropdownOpen((p) => !p)}
              >
                {colorFilter ? (
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: colorFilter }}
                  />
                ) : (
                  <Palette className="h-4 w-4" />
                )}
                <span className="hidden sm:inline text-sm">
                  {t("collections.filterByColor")}
                </span>
              </Button>
              {colorFilter && (
                <button
                  onClick={() => handleColorFilter(null)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              {colorDropdownOpen && (
                <div className="absolute top-12 left-0 z-[100] bg-white/95 dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-xl p-3 min-w-[180px]">
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                    Màu sắc
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorFilter(color.value)}
                        className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                          colorFilter === color.value
                            ? "ring-2 ring-blue-500 ring-offset-1 border-white"
                            : "border-white/50"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add Word */}
            <AddWordModal
              open={addWordModalOpen}
              onOpenChange={setAddWordModalOpen}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-lg border bg-white/80 dark:bg-gray-900 border-gray-200/80 dark:border-gray-800 border-b-[2px] border-b-blue-300 dark:border-b-blue-700 flex items-center gap-1.5"
                  data-shortcut="add-word"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">
                    {t("collections.addWord")}
                  </span>
                </Button>
              }
            />

            {/* Create Collection */}
            <CreateCollectionModal />
          </div>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50/60 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <Layers className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("collections.noCollectionsFound")}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchQuery
                ? t("collections.tryAdjustingSearch")
                : t("collections.createFirstCollectionPrompt")}
            </p>
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: "100ms" }}
            >
              {paginatedCollections.map((collection, index) => {
                const wordCount = collection.wordCount || 0;
                const isHex = collection.color?.startsWith("#");
                const color = collection.color || "#3B82F6";
                const CollectionIcon = getIconComponent(
                  collection.icon || "Layers",
                );

                return (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.id}`}
                    className="group block animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div
                      className="micro-card flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-border/60 border-b-[3px] transition-all duration-200"
                      style={{
                        borderBottomColor: color,
                        boxShadow: `0 2px 8px -2px ${color}20, 0 1px 3px -1px rgba(0,0,0,0.05)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 14px 32px -14px ${color}46, 0 10px 22px -18px rgba(0,0,0,0.32)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 2px 8px -2px ${color}20, 0 1px 3px -1px rgba(0,0,0,0.05)`;
                      }}
                    >
                      {/* Card Content */}
                      <div className="flex-1 p-5">
                        {/* Icon + Title row */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: isHex ? `${color}20` : undefined,
                            }}
                          >
                            <CollectionIcon
                              className="h-6 w-6"
                              style={{ color: isHex ? color : undefined }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg leading-tight line-clamp-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                              {collection.name}
                            </h3>
                            {collection.difficultyLevel && (
                              <span className="inline-block mt-1 text-xs text-gray-400 dark:text-gray-500">
                                {t(
                                  getDifficultyLabelKey(
                                    collection.difficultyLevel,
                                  ),
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {wordCount.toLocaleString()}{" "}
                            {t("collections.wordsLabel")}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {new Date(
                              collection.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="px-5 pb-5">
                        <div className="micro-press w-full py-2.5 text-center text-sm font-medium text-blue-500 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800 rounded-lg group-hover:bg-blue-50/40 dark:group-hover:bg-blue-900/20 transition-colors">
                          Chi tiết
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-full bg-white/80 dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-500 dark:text-gray-300 w-8 h-8 p-0 sm:w-auto sm:h-auto sm:px-4 sm:py-2"
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
                          className={`rounded-full w-8 h-8 p-0 text-sm ${
                            currentPage === page
                              ? "bg-blue-500 text-white hover:bg-blue-600"
                              : "bg-white/80 dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-500 dark:text-gray-300"
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    },
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-full bg-white/80 dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-500 dark:text-gray-300 w-8 h-8 p-0 sm:w-auto sm:h-auto sm:px-4 sm:py-2"
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
