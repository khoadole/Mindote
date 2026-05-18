"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Volume2,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { getBestAudio } from "@/lib/dictionary-api";
import type { DictionaryEntry, DictionaryMeaning } from "@/lib/dictionary-api";
import { useTranslation } from "@/lib/i18n-provider";
import { cn } from "@/lib/utils";

// Part-of-speech color mapping (consistent with the rest of the app)
const POS_COLORS: Record<string, string> = {
  noun: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  verb: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  adjective:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  adverb:
    "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  pronoun: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
  preposition:
    "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  conjunction:
    "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  interjection:
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  exclamation: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

interface DictionaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  autoSearchOnOpen?: boolean;
}

export function DictionaryModal({
  open,
  onOpenChange,
  initialQuery = "",
  autoSearchOnOpen = false,
}: DictionaryModalProps) {
  const { t, language } = useTranslation();
  const { query, setQuery, entries, isLoading, error, search, reset } =
    useDictionary(language);
  const inputRef = useRef<HTMLInputElement>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const appliedInitialQueryRef = useRef<string | null>(null);
  const searchedInitialQueryRef = useRef<string | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      const trimmedInitialQuery = initialQuery.trim();

      if (
        trimmedInitialQuery &&
        appliedInitialQueryRef.current !== trimmedInitialQuery
      ) {
        appliedInitialQueryRef.current = trimmedInitialQuery;
        setQuery(trimmedInitialQuery);

        if (
          autoSearchOnOpen &&
          searchedInitialQueryRef.current !== trimmedInitialQuery
        ) {
          searchedInitialQueryRef.current = trimmedInitialQuery;
          void search(trimmedInitialQuery);
        }
      }

      // Small delay to ensure the dialog is rendered
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      appliedInitialQueryRef.current = null;
      searchedInitialQueryRef.current = null;
      reset();
    }
  }, [open, initialQuery, autoSearchOnOpen, reset, search, setQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        search();
      }
    },
    [query, search],
  );

  const playPronunciation = useCallback((audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAudio(true);
    audio.play().catch(() => setPlayingAudio(false));
    audio.onended = () => setPlayingAudio(false);
    audio.onerror = () => setPlayingAudio(false);
  }, []);

  // Global keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl"
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">{t("dictionary.title")}</DialogTitle>

        {/* ── Search Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("dictionary.searchPlaceholder")}
            className="flex-1 min-w-0 border-0 outline-none bg-transparent text-base text-foreground placeholder:text-muted-foreground/60"
          />
          {query.trim() && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => search()}
              disabled={isLoading}
              className="shrink-0 h-8 px-3 rounded-lg text-xs font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  {t("dictionary.search")}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* ── Results Area ── */}
        <ScrollArea className="max-h-[65vh]">
          <div className="p-5">
            {/* Empty state */}
            {!isLoading && !error && entries.length === 0 && (
              <EmptyState t={t} hasQuery={!!query.trim()} />
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                  <p className="text-sm text-muted-foreground">
                    {t("dictionary.searching")}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {error === "NOT_FOUND"
                    ? t("dictionary.notFound")
                    : t("dictionary.apiError")}
                </p>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  {error === "NOT_FOUND"
                    ? t("dictionary.notFoundHint")
                    : t("dictionary.apiErrorHint")}
                </p>
              </div>
            )}

            {/* Results */}
            {!isLoading &&
              !error &&
              entries.map((entry, idx) => (
                <EntryCard
                  key={`${entry.word}-${idx}`}
                  entry={entry}
                  playPronunciation={playPronunciation}
                  playingAudio={playingAudio}
                  t={t}
                />
              ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────

function EmptyState({
  t,
  hasQuery,
}: {
  t: (key: string) => string;
  hasQuery: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="h-20 w-20 rounded-2xl bg-primary/5 flex items-center justify-center">
        <BookOpen className="h-10 w-10 text-primary/40" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-bold text-foreground">
          {hasQuery ? t("dictionary.pressEnter") : t("dictionary.emptyTitle")}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t("dictionary.emptySubtitle")}
        </p>
      </div>
    </div>
  );
}

function EntryCard({
  entry,
  playPronunciation,
  playingAudio,
  t,
}: {
  entry: DictionaryEntry;
  playPronunciation: (url: string) => void;
  playingAudio: boolean;
  t: (key: string) => string;
}) {
  const audioUrl = getBestAudio(entry.phonetics);

  return (
    <div className="space-y-5">
      {/* Word header */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {entry.word}
            </h2>
            {entry.phonetic && (
              <span className="text-sm text-primary/70 font-mono">
                {entry.phonetic}
              </span>
            )}
          </div>
        </div>

        {audioUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => playPronunciation(audioUrl)}
            disabled={playingAudio}
            className="shrink-0 h-9 w-9 p-0 rounded-full border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <Volume2
              className={cn(
                "h-4 w-4 text-primary",
                playingAudio && "animate-pulse",
              )}
            />
          </Button>
        )}
      </div>

      {/* Meanings */}
      {entry.meanings.map((meaning, mIdx) => (
        <MeaningSection
          key={`${meaning.partOfSpeech}-${mIdx}`}
          meaning={meaning}
          t={t}
        />
      ))}

      {/* Source link */}
      {entry.sourceUrls && entry.sourceUrls.length > 0 && (
        <div className="pt-2 border-t border-border/30">
          <a
            href={entry.sourceUrls[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {t("dictionary.source")}
          </a>
        </div>
      )}
    </div>
  );
}

function MeaningSection({
  meaning,
  t,
}: {
  meaning: DictionaryMeaning;
  t: (key: string) => string;
}) {
  const posColor =
    POS_COLORS[meaning.partOfSpeech.toLowerCase()] ||
    "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30";

  return (
    <div className="space-y-3">
      {/* Part of speech tag */}
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md",
            posColor,
          )}
        >
          {meaning.partOfSpeech}
        </Badge>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {/* Definitions */}
      <ol className="space-y-3 pl-1">
        {meaning.definitions.slice(0, 5).map((def, dIdx) => (
          <li key={dIdx} className="flex gap-3">
            <span className="text-xs font-bold text-muted-foreground/50 mt-0.5 shrink-0 w-4 text-right">
              {dIdx + 1}
            </span>
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">
                {def.definition}
              </p>
              {def.example && (
                <p className="text-xs text-muted-foreground italic pl-3 border-l-2 border-primary/20">
                  &ldquo;{def.example}&rdquo;
                </p>
              )}
              {/* Synonyms inline */}
              {def.synonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase">
                    {t("dictionary.synonyms")}:
                  </span>
                  {def.synonyms.slice(0, 5).map((s) => (
                    <span
                      key={s}
                      className="text-xs text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {/* Antonyms inline */}
              {def.antonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase">
                    {t("dictionary.antonyms")}:
                  </span>
                  {def.antonyms.slice(0, 5).map((a) => (
                    <span
                      key={a}
                      className="text-xs text-destructive/70 bg-destructive/5 px-1.5 py-0.5 rounded"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Global synonyms / antonyms */}
      {meaning.synonyms.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
            {t("dictionary.synonyms")}
          </span>
          {meaning.synonyms.slice(0, 8).map((s) => (
            <span
              key={s}
              className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      {meaning.antonyms.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
            {t("dictionary.antonyms")}
          </span>
          {meaning.antonyms.slice(0, 8).map((a) => (
            <span
              key={a}
              className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-medium"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
