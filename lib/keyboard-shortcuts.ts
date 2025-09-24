"use client"

import { useEffect } from "react"

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      switch (event.key.toLowerCase()) {
        case "a":
          event.preventDefault()
          // Trigger add word modal
          const addWordButton = document.querySelector('[data-shortcut="add-word"]') as HTMLButtonElement
          addWordButton?.click()
          break
        case "f":
          event.preventDefault()
          window.location.href = "/flashcards"
          break
        case "q":
          event.preventDefault()
          window.location.href = "/quiz"
          break
        case "/":
          event.preventDefault()
          // Focus search input
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
          searchInput?.focus()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])
}
