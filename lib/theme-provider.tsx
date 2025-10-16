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
  const { user } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("dark");

  // Sync theme from database settings when user is logged in
  useEffect(() => {
    if (user && settings?.theme && !isLoading) {
      const dbTheme = settings.theme as "light" | "dark" | "system";
      setThemeState(dbTheme);

      // Save to user-specific localStorage key
      const storageKey = `mindote-theme-${user.id}`;
      localStorage.setItem(storageKey, dbTheme);
    } else if (!user) {
      // When logged out, use global theme or default
      const globalTheme = localStorage.getItem("mindote-theme-global");
      if (globalTheme) {
        setThemeState(globalTheme as "light" | "dark" | "system");
      } else {
        setThemeState("dark");
      }
    }
  }, [user, settings?.theme, isLoading]);

  const setTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);

    // Save to localStorage (user-specific or global)
    if (user) {
      const storageKey = `mindote-theme-${user.id}`;
      localStorage.setItem(storageKey, newTheme);
    } else {
      localStorage.setItem("mindote-theme-global", newTheme);
    }
  };

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

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
