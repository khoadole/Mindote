"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/lib/auth";

type ThemeProviderContextType = {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
};

const ThemeProviderContext = createContext<
  ThemeProviderContextType | undefined
>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(() => {
    // Initialize from localStorage to prevent flash
    if (typeof window !== "undefined") {
      // Check new unified key first
      let saved = localStorage.getItem("mindote-theme");

      // Migration: Check old keys if new key doesn't exist
      if (!saved) {
        // Try user-specific keys (mindote-theme-{userId})
        const allKeys = Object.keys(localStorage);
        const userThemeKey = allKeys.find((key) =>
          key.startsWith("mindote-theme-")
        );
        if (userThemeKey) {
          saved = localStorage.getItem(userThemeKey);
        }

        // Try global key
        if (!saved) {
          saved = localStorage.getItem("mindote-theme-global");
        }

        // Try from Zustand store
        if (!saved) {
          const zustandData = localStorage.getItem("mindote-storage");
          if (zustandData) {
            try {
              const parsed = JSON.parse(zustandData);
              saved = parsed.state?.settings?.theme;
            } catch (e) {}
          }
        }

        // Migrate to new key
        if (saved) {
          localStorage.setItem("mindote-theme", saved);
        }
      }

      if (saved) {
        return saved as "light" | "dark" | "system";
      }
    }
    return "dark";
  });

  // Sync theme from database settings when user is logged in
  // ✅ FIX: Only sync if user exists AND settings loaded successfully
  // ✅ OPTIMIZED: Avoid unnecessary updates when theme is already set locally
  useEffect(() => {
    // Don't do anything while auth or settings are loading
    if (authLoading || settingsLoading) {
      return;
    }

    // Only sync theme from database if user is logged in AND settings exist
    if (user && settings?.theme) {
      const dbTheme = settings.theme as "light" | "dark" | "system";
      const localTheme = localStorage.getItem("mindote-theme");

      // ✅ SMART SYNC: Only update if DB theme is different from both current state AND localStorage
      // This prevents unnecessary updates when user just changed theme (it's already in localStorage)
      if (dbTheme !== theme && dbTheme !== localTheme) {
        setThemeState(dbTheme);
        localStorage.setItem("mindote-theme", dbTheme);
      }
    }
  }, [user, settings?.theme, authLoading, settingsLoading, theme]);

  const setTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);

    // Save to unified localStorage key (same key for all users)
    localStorage.setItem("mindote-theme", newTheme);
  };

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;

    // Determine the actual theme to apply
    let themeToApply = theme;
    if (theme === "system") {
      themeToApply = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    // Only update if different from current to prevent flash
    const currentTheme = root.classList.contains("dark") ? "dark" : "light";
    if (currentTheme !== themeToApply) {
      root.classList.remove("light", "dark");
      root.classList.add(themeToApply);
    }
  }, [theme]);

  // ✅ FIX: Always render children immediately - don't wait for settings
  // Theme will be applied from localStorage first, then synced from DB when available
  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
