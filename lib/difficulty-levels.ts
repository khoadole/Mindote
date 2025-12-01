/**
 * Difficulty levels following CEFR (Common European Framework of Reference for Languages)
 * Used across the application for collections and reading materials
 */

export const DIFFICULTY_LEVELS = [
  {
    value: "Beginner",
    labelKey: "collections.difficultyLevels.beginner.label",
    cefrCode: "A1",
    descriptionKey: "collections.difficultyLevels.beginner.description",
  },
  {
    value: "Elementary",
    labelKey: "collections.difficultyLevels.elementary.label",
    cefrCode: "A2",
    descriptionKey: "collections.difficultyLevels.elementary.description",
  },
  {
    value: "Intermediate",
    labelKey: "collections.difficultyLevels.intermediate.label",
    cefrCode: "B1",
    descriptionKey: "collections.difficultyLevels.intermediate.description",
  },
  {
    value: "Upper Intermediate",
    labelKey: "collections.difficultyLevels.upperIntermediate.label",
    cefrCode: "B2",
    descriptionKey: "collections.difficultyLevels.upperIntermediate.description",
  },
  {
    value: "Advanced",
    labelKey: "collections.difficultyLevels.advanced.label",
    cefrCode: "C1",
    descriptionKey: "collections.difficultyLevels.advanced.description",
  },
  {
    value: "Proficient",
    labelKey: "collections.difficultyLevels.proficient.label",
    cefrCode: "C2",
    descriptionKey: "collections.difficultyLevels.proficient.description",
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

// Helper function to get label key from difficulty level value
export function getDifficultyLabelKey(difficultyLevel: string): string {
  const level = DIFFICULTY_LEVELS.find((l) => l.value === difficultyLevel);
  return level?.labelKey || "collections.difficultyLevels.intermediate.label";
}
