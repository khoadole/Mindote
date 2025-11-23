"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { DEFAULT_LANGUAGE } from "@/lib/languages";

// Translation type based on our JSON structure
type TranslationKeys = {
  common: Record<string, string>;
  settings: Record<string, string>;
  dashboard: Record<string, string>;
  landing: Record<string, string>;
  auth: Record<string, string>;
  collections: Record<string, string>;
  flashcards: Record<string, string>;
  quiz: Record<string, string>;
  reading: Record<string, string>;
  youtube: Record<string, string>;
  toast: Record<string, string>;
};

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
  translations: TranslationKeys | null;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [translations, setTranslations] = useState<TranslationKeys | null>(
    null
  );
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    DEFAULT_LANGUAGE
  );

  // Load translations when language changes
  useEffect(() => {
    const langCode = settings?.language || DEFAULT_LANGUAGE;
    setCurrentLanguage(langCode);

    // Dynamically import the translation file
    import(`@/messages/${langCode}.json`)
      .then((module) => {
        setTranslations(module.default);
      })
      .catch((error) => {
        console.error(`Failed to load translations for ${langCode}:`, error);
        // Fallback to English if loading fails
        if (langCode !== DEFAULT_LANGUAGE) {
          import(`@/messages/${DEFAULT_LANGUAGE}.json`).then((module) => {
            setTranslations(module.default);
          });
        }
      });
  }, [settings?.language]);

  // Sync with localStorage as well
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("language");
      if (stored && stored !== currentLanguage) {
        setCurrentLanguage(stored);
      }
    }
  }, [currentLanguage]);

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    // Save to localStorage immediately
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
    // Save to database
    updateSettings.mutate({ language: lang });
  };

  // Translation function with nested key support and variable interpolation
  const t = (key: string, params?: Record<string, any>): string => {
    if (!translations) return key;

    // Split the key by dots to support nested keys like "common.back"
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Key not found, return the key itself as fallback
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // If we have a string, process variable interpolation
    if (typeof value === "string") {
      if (params) {
        // Replace {{variable}} with actual values
        return value.replace(/\{\{(\w+)\}\}/g, (_, variable) => {
          return params[variable]?.toString() || `{{${variable}}}`;
        });
      }
      return value;
    }

    // If value is not a string, return the key
    return key;
  };

  return (
    <TranslationContext.Provider
      value={{
        language: currentLanguage,
        setLanguage,
        t,
        translations,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
