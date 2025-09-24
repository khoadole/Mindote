"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { useAppStore } from "./store"

type ThemeProviderContextType = {
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useAppStore()

  const setTheme = (theme: "light" | "dark" | "system") => {
    updateSettings({ theme })
  }

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(settings.theme)
    }
  }, [settings.theme])

  return (
    <ThemeProviderContext.Provider value={{ theme: settings.theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
