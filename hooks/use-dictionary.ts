"use client";

import { useState, useCallback, useRef } from "react";
import { lookupWord, type DictionaryEntry } from "@/lib/dictionary-api";

interface UseDictionaryReturn {
  /** The current search query displayed in the input */
  query: string;
  setQuery: (q: string) => void;
  /** The fetched dictionary entries (multiple meanings possible) */
  entries: DictionaryEntry[];
  /** Loading state */
  isLoading: boolean;
  /** Error key: "NOT_FOUND" | "EMPTY_WORD" | "API_ERROR" | null */
  error: string | null;
  /** Trigger a lookup */
  search: (word?: string) => Promise<void>;
  /** Reset everything */
  reset: () => void;
}

export function useDictionary(langCode: string = "en"): UseDictionaryReturn {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (word?: string) => {
      const searchTerm = word ?? query;
      if (!searchTerm.trim()) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setEntries([]);

      try {
        const result = await lookupWord(searchTerm, langCode);
        setEntries(result);
      } catch (err: any) {
        setError(err.message || "API_ERROR");
      } finally {
        setIsLoading(false);
      }
    },
    [query, langCode],
  );

  const reset = useCallback(() => {
    setQuery("");
    setEntries([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return { query, setQuery, entries, isLoading, error, search, reset };
}
