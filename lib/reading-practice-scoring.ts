import type {
  ReadingPracticeBlock,
  ReadingPracticeQuestion,
} from "@/lib/reading-practice-types";

export interface ReadingPracticeQuestionResult {
  blockId: string;
  questionId: string;
  isCorrect: boolean;
  userAnswer: unknown;
  correctAnswer: unknown;
  explanation?: string;
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
        if (Array.isArray(userAnswer)) {
          return compareArraySet(userAnswer, question.correctAnswer);
        }
        return false;
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

  for (const block of blocks) {
    for (const question of block.questions) {
      const userAnswer = userAnswers[question.id];
      const isCorrect = isQuestionCorrect(block.type, question, userAnswer);

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

  const totalCount = breakdown.length;
  const correctCount = breakdown.filter((item) => item.isCorrect).length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return {
    correctCount,
    totalCount,
    score,
    breakdown,
  };
}
