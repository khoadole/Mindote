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

// ============================================
// WRITING PRACTICE TYPES
// ============================================

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type WritingPassage = {
  id: string;
  title: string;
  titleEn?: string | null;
  sourceText: string;
  referenceText?: string | null;
  level: CEFRLevel;
  topic: string;
  tags: string[];
  targetWordCount: number;
  estimatedMinutes: number;
  isPublished: boolean;
  order: number;
  vocabularyHints?: unknown | null;
  grammarFocus?: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined: user's attempt info
  _attemptCount?: number;
  _lastScore?: number | null;
};

export type AIWritingStrength = {
  title: string;
  detail: string;
  quote: string;
};

export type AIWritingImprovement = {
  title: string;
  original: string;
  corrected: string;
  explanation: string;
};

export type AIVocabSuggestion = {
  original: string;
  better: string;
  reason: string;
};

export type AIWritingResult = {
  overallScore: number;
  estimatedLevel: CEFRLevel;
  wordCount: number;
  strengths: AIWritingStrength[];
  improvements: AIWritingImprovement[];
  grammar: {
    score: number;
    summary: string;
  };
  spelling: {
    score: number;
    errors: Array<{ original: string; correction: string }>;
  };
  vocabulary: {
    score: number;
    highlights: string[];
    suggestions: AIVocabSuggestion[];
  };
  lengthFeedback: string | null;
  encouragement: string;
};

export type WritingAttempt = {
  id: string;
  userId: string;
  passageId: string;
  userText: string;
  aiResult: AIWritingResult | null;
  score: number | null;
  completedAt: string;
  updatedAt: string;
};
