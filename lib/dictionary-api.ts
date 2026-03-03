/**
 * Free Dictionary API utility
 * https://dictionaryapi.dev/
 *
 * Supports: en, es, fr, de, it, pt, ja, ko, zh (+ more)
 */

// --- Type Definitions ---

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
  license?: { name: string; url: string };
}

export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  license?: { name: string; url: string };
  sourceUrls?: string[];
}

export interface DictionaryError {
  title: string;
  message: string;
  resolution: string;
}

// Map UI language codes to the API language codes supported by the Free Dictionary API
const LANGUAGE_MAP: Record<string, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  it: "it",
  pt: "pt-BR",
  ja: "ja",
  ko: "ko",
  zh: "zh",
  vi: "en", // Vietnamese is not supported — fallback to English
};

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries";

/**
 * Look up a word using the Free Dictionary API.
 * Returns the first matching entry array, or throws on error.
 */
export async function lookupWord(
  word: string,
  langCode: string = "en",
): Promise<DictionaryEntry[]> {
  const lang = LANGUAGE_MAP[langCode] || "en";
  const trimmed = word.trim().toLowerCase();

  if (!trimmed) {
    throw new Error("EMPTY_WORD");
  }

  const res = await fetch(`${API_BASE}/${lang}/${encodeURIComponent(trimmed)}`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("NOT_FOUND");
    }
    throw new Error("API_ERROR");
  }

  const data: DictionaryEntry[] = await res.json();
  return data;
}

/**
 * Get the best available audio URL from a dictionary entry's phonetics.
 */
export function getBestAudio(
  phonetics: DictionaryPhonetic[],
): string | undefined {
  return phonetics.find((p) => p.audio && p.audio.length > 0)?.audio;
}
