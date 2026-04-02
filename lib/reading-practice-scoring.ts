import type {
  ReadingPracticeBlock,
  ReadingPracticeQuestion,
} from "@/lib/reading-practice-types";
import { countReadingPracticeQuestionUnits } from "@/lib/reading-practice-types";

export interface ReadingPracticeQuestionResult {
  blockId: string;
  questionId: string;
  isCorrect: boolean;
  userAnswer: unknown;
  correctAnswer: unknown;
  explanation?: string | string[];
}

export interface ReadingPracticeScoreResult {
  correctCount: number;
  totalCount: number;
  score: number;
  breakdown: ReadingPracticeQuestionResult[];
}

function normalizeText(input: string, caseSensitive: boolean): string {
  const normalized = input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[\s.,!?;:'"()\[\]{}]+|[\s.,!?;:'"()\[\]{}]+$/g, "");

  return caseSensitive ? normalized : normalized.toLowerCase();
}

function compareStringAnswer(
  userAnswer: unknown,
  question: ReadingPracticeQuestion
): boolean {
  if (typeof userAnswer !== "string") return false;
  const caseSensitive = Boolean(question.caseSensitive);
  const user = normalizeText(userAnswer, caseSensitive);

  const accepted = [question.correctAnswer, ...(question.acceptableAnswers || [])]
    .filter((v): v is string => typeof v === "string")
    .map((v) => normalizeText(v, caseSensitive));

  return accepted.includes(user);
}

function compareArraySet(userAnswer: unknown, correctAnswer: unknown): boolean {
  if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
  const userSet = new Set(userAnswer.map((v) => String(v).trim().toLowerCase()));
  const correctSet = new Set(correctAnswer.map((v) => String(v).trim().toLowerCase()));

  if (userSet.size !== correctSet.size) return false;
  for (const answer of correctSet) {
    if (!userSet.has(answer)) return false;
  }
  return true;
}

function compareArrayByOrder(
  userAnswer: unknown,
  correctAnswer: unknown,
  caseSensitive: boolean
): boolean {
  if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
  if (userAnswer.length !== correctAnswer.length) return false;

  for (let i = 0; i < correctAnswer.length; i += 1) {
    const user = normalizeText(String(userAnswer[i] ?? ""), caseSensitive);
    const correct = normalizeText(String(correctAnswer[i] ?? ""), caseSensitive);
    if (user !== correct) return false;
  }

  return true;
}

function compareMapAnswers(userAnswer: unknown, correctAnswer: unknown): boolean {
  if (!userAnswer || !correctAnswer || typeof userAnswer !== "object" || typeof correctAnswer !== "object") {
    return false;
  }

  const userEntries = Object.entries(userAnswer as Record<string, unknown>);
  const correctEntries = Object.entries(correctAnswer as Record<string, unknown>);

  if (userEntries.length !== correctEntries.length) return false;

  for (const [key, correctValue] of correctEntries) {
    const userValue = (userAnswer as Record<string, unknown>)[key];
    if (String(userValue).trim().toLowerCase() !== String(correctValue).trim().toLowerCase()) {
      return false;
    }
  }

  return true;
}

function isQuestionCorrect(
  type: string,
  question: ReadingPracticeQuestion,
  userAnswer: unknown
): boolean {
  switch (type) {
    case "true-false-not-given":
    case "yes-no-not-given":
    case "multiple-choice-single":
      return String(userAnswer).trim().toLowerCase() ===
        String(question.correctAnswer).trim().toLowerCase();

    case "multiple-choice-multi":
      return compareArraySet(userAnswer, question.correctAnswer);

    case "matching-headings":
    case "matching-information":
    case "matching-features":
      if (typeof question.correctAnswer === "object" && question.correctAnswer !== null) {
        return compareMapAnswers(userAnswer, question.correctAnswer);
      }
      return String(userAnswer).trim().toLowerCase() ===
        String(question.correctAnswer).trim().toLowerCase();

    case "fill-in-the-blank":
    case "short-answer":
    case "sentence-completion":
    case "summary-completion":
    case "diagram-label-completion":
      if (Array.isArray(question.correctAnswer)) {
        return compareArrayByOrder(
          userAnswer,
          question.correctAnswer,
          Boolean(question.caseSensitive)
        );
      }
      return compareStringAnswer(userAnswer, question);

    default:
      return false;
  }
}

export function scoreReadingPracticeAttempt(
  blocks: ReadingPracticeBlock[],
  userAnswers: Record<string, unknown>
): ReadingPracticeScoreResult {
  const breakdown: ReadingPracticeQuestionResult[] = [];
  let totalCount = 0;
  let correctCount = 0;

  for (const block of blocks) {
    for (const question of block.questions) {
      if (question.itemType === "subtitle") {
        continue;
      }

      const questionTotalCount = countReadingPracticeQuestionUnits(question, block.type);
      if (questionTotalCount === 0) {
        continue;
      }

      const userAnswer = userAnswers[question.id];
      const isCorrect = isQuestionCorrect(block.type, question, userAnswer);

      let questionCorrectCount = isCorrect ? questionTotalCount : 0;

      if (Array.isArray(question.correctAnswer)) {
        const expected = question.correctAnswer;
        const given = Array.isArray(userAnswer) ? userAnswer : [];
        const caseSensitive = Boolean(question.caseSensitive);

        questionCorrectCount = expected.reduce((sum, correctItem, index) => {
          const userItem = normalizeText(String(given[index] ?? ""), caseSensitive);
          const correctValue = normalizeText(String(correctItem ?? ""), caseSensitive);
          return userItem === correctValue ? sum + 1 : sum;
        }, 0);
      }

      totalCount += questionTotalCount;
      correctCount += questionCorrectCount;

      breakdown.push({
        blockId: block.id,
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    }
  }

  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return {
    correctCount,
    totalCount,
    score,
    breakdown,
  };
}
