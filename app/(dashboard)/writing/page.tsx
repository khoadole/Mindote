"use client";

import { useState } from "react";
import { PenLine, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PassageCard } from "@/components/writing/passage-card";
import { WritingWorkspace } from "@/components/writing/writing-workspace";
import { useWritingPassages } from "@/hooks/use-writing";
import type { WritingPassage } from "@/lib/types";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const TOPICS = [
  "Daily Life",
  "Travel",
  "Food & Cooking",
  "Family & Relationships",
  "Education",
  "Work & Career",
  "Technology",
  "Environment",
  "Health & Fitness",
  "Culture & Traditions",
  "Sports",
  "Entertainment",
  "Society & Community",
  "Economics",
  "Science",
];

const PAGE_SIZE = 9;

export default function WritingPage() {
  const { t } = useTranslation();
  const [selectedPassage, setSelectedPassage] =
    useState<WritingPassage | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: passages, isLoading } = useWritingPassages({
    level: levelFilter || undefined,
    topic: topicFilter || undefined,
    search: search || undefined,
  });

  const totalPages = passages ? Math.ceil(passages.length / PAGE_SIZE) : 1;
  const paginatedPassages = passages?.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function resetPage() {
    setCurrentPage(1);
  }

  if (selectedPassage) {
    return (
      <div className="p-6 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
        <div className="relative z-10 max-w-5xl mx-auto">
          <WritingWorkspace
            passage={selectedPassage}
            onBack={() => setSelectedPassage(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-background min-h-screen relative overflow-hidden transition-all duration-300">
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2">
            <PenLine className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold">{t("writing.title")}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("writing.pageSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-500"
          style={{ animationDelay: "80ms" }}
        >
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              placeholder={t("writing.searchPassages")}
              className="pl-9"
            />
          </div>

          <Select
            value={levelFilter || "all"}
            onValueChange={(v) => { setLevelFilter(v === "all" ? "" : v); resetPage(); }}
          >
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t("writing.levelPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("writing.filterAll")}</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={topicFilter || "all"}
            onValueChange={(v) => { setTopicFilter(v === "all" ? "" : v); resetPage(); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("writing.topicPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("writing.filterAllTopics")}</SelectItem>
              {TOPICS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(levelFilter || topicFilter || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLevelFilter("");
                setTopicFilter("");
                setSearch("");
                resetPage();
              }}
            >
              {t("writing.clearFilters")}
            </Button>
          )}
        </div>

        {/* Passage Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl border bg-muted/50 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        ) : !passages || passages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-in fade-in duration-500"
            style={{ animationDelay: "200ms" }}
          >
            <PenLine className="h-14 w-14 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">No passages found</p>
            <p className="text-sm">
              {levelFilter || topicFilter || search
                ? "Try adjusting your filters."
                : "Passages will appear here once they are published."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPassages!.map((passage, idx) => (
                <div
                  key={passage.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <PassageCard
                    passage={passage}
                    onClick={() => setSelectedPassage(passage)}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
