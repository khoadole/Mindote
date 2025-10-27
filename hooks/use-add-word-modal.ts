"use client";

import { useState, useCallback } from "react";

interface WordData {
  term: string;
  definition: string;
  example: string;
}

export function useAddWordModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [wordData, setWordData] = useState<WordData>({
    term: "",
    definition: "",
    example: "",
  });

  const openModal = useCallback((data: Partial<WordData>) => {
    setWordData({
      term: data.term || "",
      definition: data.definition || "",
      example: data.example || "",
    });
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    wordData,
    openModal,
    closeModal,
  };
}
