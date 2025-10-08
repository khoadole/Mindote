import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppState, Word, Collection } from "./types";

// Generate unique IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Seed data
const seedCollections: Collection[] = [
  {
    id: "food-fruit",
    name: "Food & Fruit",
    color: "bg-primary",
    createdAt: new Date().toISOString(),
  },
  {
    id: "daily-conversation",
    name: "Daily Conversation",
    color: "bg-accent",
    createdAt: new Date().toISOString(),
  },
];

const seedWords: Word[] = [
  {
    id: "apple-1",
    term: "apple",
    definition: "A round fruit with red or green skin and white flesh",
    example: "I eat an apple every morning for breakfast.",
    phonetic: "/ˈæpəl/",
    collectionId: "food-fruit",
    createdAt: new Date().toISOString(),
    score: 0,
  },
  {
    id: "banana-1",
    term: "banana",
    definition: "A long curved yellow fruit that grows in tropical regions",
    example: "She added sliced banana to her cereal.",
    phonetic: "/bəˈnænə/",
    collectionId: "food-fruit",
    createdAt: new Date().toISOString(),
    score: 0,
  },
  {
    id: "hello-1",
    term: "hello",
    definition: "A greeting used when meeting someone",
    example: "Hello, how are you today?",
    phonetic: "/həˈloʊ/",
    collectionId: "daily-conversation",
    createdAt: new Date().toISOString(),
    score: 0,
  },
];

interface AppStore extends AppState {
  // Actions
  addWord: (word: Omit<Word, "id" | "createdAt">) => void;
  updateWord: (id: string, updates: Partial<Word>) => void;
  deleteWord: (id: string) => void;
  addCollection: (collection: Omit<Collection, "id" | "createdAt">) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  updateSettings: (settings: Partial<AppState["settings"]>) => void;
  resetData: () => void;
  searchWords: (query: string) => Word[];
  getWordsByCollection: (collectionId: string) => Word[];
  suggestCollection: (term: string) => Collection | null;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      words: seedWords,
      collections: seedCollections,
      settings: {
        srsEnabled: false,
        ttsEnabled: false,
        theme: "dark",
        language: "en",
      },

      // Actions
      addWord: (wordData) => {
        const word: Word = {
          ...wordData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          words: [...state.words, word],
        }));
      },

      updateWord: (id, updates) => {
        set((state) => ({
          words: state.words.map((word) =>
            word.id === id ? { ...word, ...updates } : word
          ),
        }));
      },

      deleteWord: (id) => {
        set((state) => ({
          words: state.words.filter((word) => word.id !== id),
        }));
      },

      addCollection: (collectionData) => {
        const collection: Collection = {
          ...collectionData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          collections: [...state.collections, collection],
        }));
      },

      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === id ? { ...collection, ...updates } : collection
          ),
        }));
      },

      deleteCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter(
            (collection) => collection.id !== id
          ),
          words: state.words.map((word) =>
            word.collectionId === id
              ? { ...word, collectionId: undefined }
              : word
          ),
        }));
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetData: () => {
        set({
          words: seedWords,
          collections: seedCollections,
          settings: {
            srsEnabled: false,
            ttsEnabled: false,
            theme: "dark",
            language: "en",
          },
        });
      },

      searchWords: (query) => {
        const { words } = get();
        return words.filter(
          (word) =>
            word.term.toLowerCase().includes(query.toLowerCase()) ||
            word.definition.toLowerCase().includes(query.toLowerCase())
        );
      },

      getWordsByCollection: (collectionId) => {
        const { words } = get();
        return words.filter((word) => word.collectionId === collectionId);
      },

      suggestCollection: (term) => {
        const { collections } = get();
        const termLower = term.toLowerCase();

        // Simple keyword matching
        const foodKeywords = [
          "apple",
          "banana",
          "food",
          "fruit",
          "eat",
          "drink",
        ];
        const conversationKeywords = [
          "hello",
          "hi",
          "goodbye",
          "please",
          "thank",
          "sorry",
        ];

        if (foodKeywords.some((keyword) => termLower.includes(keyword))) {
          return (
            collections.find((c) => c.name.toLowerCase().includes("food")) ||
            null
          );
        }

        if (
          conversationKeywords.some((keyword) => termLower.includes(keyword))
        ) {
          return (
            collections.find((c) =>
              c.name.toLowerCase().includes("conversation")
            ) || null
          );
        }

        return null;
      },
    }),
    {
      name: "wordflow-storage",
    }
  )
);
