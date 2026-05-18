"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AddWordModal } from "@/components/modals/add-word-modal";
import { DictionaryModal } from "@/components/modals/dictionary-modal";
import { useSearchWords } from "@/hooks/use-words";
import { useTranslation } from "@/lib/i18n-provider";
import { cn } from "@/lib/utils";
import { getPosBadgeClassName } from "@/lib/pos-colors";
import {
  ArrowRight,
  BookOpenText,
  CornerDownLeft,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

type SearchWord = {
  id: string;
  term: string;
  definition: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  collectionId: string;
  collectionName: string;
  collectionColor?: string | null;
};

type CommandItem =
  | { type: "word"; word: SearchWord }
  | { type: "lookup"; query: string }
  | { type: "add"; query: string };

export function WordCommandSearch() {
  const { t } = useTranslation();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [addTerm, setAddTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [dictionaryQuery, setDictionaryQuery] = useState("");
  const [dictionaryOpen, setDictionaryOpen] = useState(false);

  const trimmedQuery = query.trim();
  const { data: searchResults = [], isFetching } = useSearchWords(debouncedQuery);
  const words = (searchResults || []) as SearchWord[];
  const isSettledQuery = debouncedQuery === trimmedQuery;
  const isSearching = trimmedQuery.length > 0 && (!isSettledQuery || isFetching);
  const displayedWords = useMemo(
    () => (isSettledQuery ? words : []),
    [isSettledQuery, words],
  );
  const visibleWords = useMemo(
    () => displayedWords.slice(0, 6),
    [displayedWords],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [trimmedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = useMemo<CommandItem[]>(() => {
    if (!trimmedQuery) return [];

    return [
      ...visibleWords.map((word) => ({ type: "word" as const, word })),
      { type: "lookup" as const, query: trimmedQuery },
      { type: "add" as const, query: trimmedQuery },
    ];
  }, [trimmedQuery, visibleWords]);

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(-1);
    }
  }, [items.length, selectedIndex]);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      ) as HTMLElement | null;

      selectedElement?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const openAddWord = (term = trimmedQuery) => {
    const nextTerm = term.trim();
    if (!nextTerm) return;
    setAddTerm(nextTerm);
    setAddOpen(true);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const openDictionary = (term = trimmedQuery) => {
    const nextTerm = term.trim();
    if (!nextTerm) return;
    setDictionaryQuery(nextTerm);
    setDictionaryOpen(true);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleSelect = (item: CommandItem) => {
    if (item.type === "word") {
      router.push(`/collections/${item.word.collectionId}?wordId=${item.word.id}`);
      setQuery("");
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (item.type === "lookup") {
      openDictionary(item.query);
      return;
    }

    openAddWord(item.query);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (!trimmedQuery) return;

    if (event.key === "Enter") {
      event.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        handleSelect(items[selectedIndex]);
      } else {
        openAddWord();
      }
      return;
    }

    if (!isOpen || items.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.trim().length > 0);
    setSelectedIndex(-1);
  };

  const clearQuery = () => {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const hasResults = displayedWords.length > 0;

  return (
    <>
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-normal text-stone-900 dark:text-foreground md:text-5xl">
            {t("dashboard.wordCommandTitle")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {t("dashboard.wordCommandSubtitle")}
          </p>
        </div>

        <div ref={rootRef} className="relative w-full">
          <div className="relative flex h-14 items-center rounded-full border border-stone-200 bg-white px-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-[0_16px_46px_rgba(59,130,246,0.14)] dark:border-border dark:bg-[#121212] md:h-16 md:px-6">
            <Search className="h-5 w-5 shrink-0 text-stone-400 dark:text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onFocus={() => trimmedQuery && setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={t("dashboard.wordCommandPlaceholder")}
              className="h-full min-w-0 flex-1 bg-transparent px-4 text-base font-medium text-stone-900 outline-none placeholder:text-stone-400 dark:text-foreground dark:placeholder:text-muted-foreground md:text-lg"
              aria-label={t("dashboard.wordCommandPlaceholder")}
            />
            <div className="flex shrink-0 items-center gap-2">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : null}
              {query ? (
                <button
                  type="button"
                  onClick={clearQuery}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {isOpen && trimmedQuery ? (
            <div
              ref={listRef}
              className="absolute left-0 right-0 top-full z-40 mt-3 max-h-[420px] overflow-y-auto rounded-3xl border border-stone-200 bg-white p-2 text-left shadow-2xl shadow-slate-900/10 dark:border-border dark:bg-card"
            >
              <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-muted-foreground">
                {t("dashboard.inYourWords")}
              </div>

              {isSearching ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("dashboard.searchingWords")}
                </div>
              ) : null}

              {!isSearching && !hasResults ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t("dashboard.noSavedWordsFound")}
                </div>
              ) : null}

              {visibleWords.map((word, index) => (
                <button
                  key={word.id}
                  type="button"
                  data-index={index}
                  onClick={() => handleSelect({ type: "word", word })}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors",
                    selectedIndex === index
                      ? "bg-primary/10"
                      : "hover:bg-stone-50 dark:hover:bg-muted/60",
                  )}
                >
                  <div
                    className="h-9 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: word.collectionColor || "#3B82F6" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-semibold text-stone-900 dark:text-foreground">
                        {word.term}
                      </span>
                      {word.partOfSpeech ? (
                        <Badge
                          className={cn(
                            "shrink-0 text-[10px]",
                            getPosBadgeClassName(word.partOfSpeech),
                          )}
                        >
                          {word.partOfSpeech}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {word.definition}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="max-w-[140px] shrink-0 truncate text-xs"
                  >
                    {word.collectionName}
                  </Badge>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}

              <div className="mt-2 border-t border-stone-100 pt-2 dark:border-border">
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-muted-foreground">
                  {t("dashboard.actions")}
                </div>
                {items.slice(visibleWords.length).map((item, localIndex) => {
                  const index = visibleWords.length + localIndex;
                  const isLookup = item.type === "lookup";

                  return (
                    <button
                      key={`${item.type}-${trimmedQuery}`}
                      type="button"
                      data-index={index}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors",
                        selectedIndex === index
                          ? "bg-primary/10"
                          : "hover:bg-stone-50 dark:hover:bg-muted/60",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          isLookup
                            ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300"
                            : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
                        )}
                      >
                        {isLookup ? (
                          <BookOpenText className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-stone-900 dark:text-foreground">
                          {isLookup
                            ? t("dashboard.lookupQuery", { query: trimmedQuery })
                            : t("dashboard.addQuery", { query: trimmedQuery })}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {isLookup
                            ? t("dashboard.lookupHint")
                            : t("dashboard.addHint")}
                        </p>
                      </div>
                      {!isLookup ? (
                        <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>{t("dashboard.trySearches")}</span>
          {["abandon", "take off", "sustainable"].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQuery(term);
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="rounded-full border border-border px-3 py-1 text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      <AddWordModal
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultTerm={addTerm}
      />
      <DictionaryModal
        open={dictionaryOpen}
        onOpenChange={setDictionaryOpen}
        initialQuery={dictionaryQuery}
        autoSearchOnOpen
      />
    </>
  );
}
