"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useCollectionKeyboardShortcuts(collectionId: string) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "a":
          event.preventDefault();
          // Trigger add word modal
          const addWordButton = document.querySelector(
            '[data-shortcut="add-word"]'
          ) as HTMLButtonElement;
          addWordButton?.click();
          break;
        case "f":
          event.preventDefault();
          // Navigate to flashcards for this collection
          router.push(`/flashcards?collection=${collectionId}`);
          break;
        case "q":
          event.preventDefault();
          // Navigate to quiz for this collection
          router.push(`/quiz?collection=${collectionId}`);
          break;
        case "/":
          event.preventDefault();
          // Focus search input
          const searchInput = document.querySelector(
            'input[placeholder*="Search"]'
          ) as HTMLInputElement;
          searchInput?.focus();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [collectionId, router]);
}
