/**
 * Difficulty levels following CEFR (Common European Framework of Reference for Languages)
 * Used across the application for collections and reading materials
 */

export const DIFFICULTY_LEVELS = [
  {
    value: "Beginner",
    label: "Beginner",
    cefrCode: "A1",
    description: "Simple, basic vocabulary",
  },
  {
    value: "Elementary",
    label: "Elementary",
    cefrCode: "A2",
    description: "Common everyday topics",
  },
  {
    value: "Intermediate",
    label: "Intermediate",
    cefrCode: "B1",
    description: "Familiar topics and ideas",
  },
  {
    value: "Upper Intermediate",
    label: "Upper Intermediate",
    cefrCode: "B2",
    description: "Complex text and abstract topics",
  },
  {
    value: "Advanced",
    label: "Advanced",
    cefrCode: "C1",
    description: "Demanding, longer texts",
  },
  {
    value: "Proficient",
    label: "Proficient",
    cefrCode: "C2",
    description: "Very complex academic texts",
  },
] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]["value"];

// Helper function to get CEFR code from difficulty level name
export function getCefrCode(difficultyLevel: string): string {
  const level = DIFFICULTY_LEVELS.find((l) => l.value === difficultyLevel);
  return level?.cefrCode || "B1";
}

// Helper function to get difficulty level from CEFR code
export function getDifficultyFromCefr(cefrCode: string): string {
  const level = DIFFICULTY_LEVELS.find((l) => l.cefrCode === cefrCode);
  return level?.value || "Intermediate";
}
