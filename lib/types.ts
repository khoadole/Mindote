export type Word = {
  id: string;
  term: string;
  definition: string;
  example?: string;
  phonetic?: string;
  partOfSpeech?: string;
  createdAt: string;
  collectionId?: string;
  score?: number;
  // Multi-language fields
  termLanguage?: string;
  definitionLanguage?: string;
  exampleLanguage?: string;
  // SRS fields
  easeFactor?: number;
  interval?: number;
  repetitions?: number;
  lastReviewed?: string | null;
  nextReview?: string | null;
};

export type Collection = {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
};

export type AppState = {
  words: Word[];
  collections: Collection[];
  settings: {
    srsEnabled: boolean;
    ttsEnabled: boolean;
    theme: "light" | "dark" | "system";
    language:
      | "en"
      | "es"
      | "fr"
      | "de"
      | "it"
      | "pt"
      | "ru"
      | "ja"
      | "ko"
      | "zh"
      | "vi";
    learningLanguage?:
      | "en"
      | "es"
      | "fr"
      | "de"
      | "it"
      | "pt"
      | "ja"
      | "ko"
      | "zh"
      | "vi";
  };
};

export type StudySession = {
  id: string;
  type: "flashcard" | "quiz";
  wordIds: string[];
  score?: number;
  completedAt?: string;
};
