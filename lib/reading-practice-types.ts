export type ReadingPracticeQuestionType =
  | "true-false-not-given"
  | "yes-no-not-given"
  | "multiple-choice-single"
  | "multiple-choice-multi"
  | "matching-headings"
  | "matching-information"
  | "matching-features"
  | "fill-in-the-blank"
  | "short-answer"
  | "sentence-completion"
  | "summary-completion"
  | "diagram-label-completion";

export interface ReadingPracticeQuestion {
  id: string;
  itemType?: "question" | "subtitle";
  prompt: string;
  options?: string[];
  // Can be string, string[] or map depending on question type
  correctAnswer: unknown;
  acceptableAnswers?: string[];
  caseSensitive?: boolean;
  explanation?: string | string[];
}

export interface ReadingPracticeBlock {
  id: string;
  type: ReadingPracticeQuestionType;
  title?: string;
  sectionTitle?: string;
  instruction?: string;
  matchingOptions?: string[];
  questions: ReadingPracticeQuestion[];
}

export interface ReadingPracticePayload {
  examTitle: string;
  examCode?: string | null;
  partNumber: number;
  title: string;
  content: string;
  instructions?: string | null;
  questionBlocks: ReadingPracticeBlock[];
  estimatedMinutes?: number;
  level?: string | null;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED";
  displayOrder?: number;
}

export interface ReadingPracticeValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedBlocks: ReadingPracticeBlock[];
  totalQuestions: number;
}

const INLINE_BLANK_TYPES: Set<ReadingPracticeQuestionType> = new Set([
  "fill-in-the-blank",
  "sentence-completion",
  "summary-completion",
  "diagram-label-completion",
]);

function countInlineBlankPlaceholders(prompt: string): number {
  const matches = prompt.match(/\[blank\]|__+/gi);
  return matches ? matches.length : 0;
}

export function countReadingPracticeQuestionUnits(
  question: Pick<
    ReadingPracticeQuestion,
    "itemType" | "correctAnswer" | "prompt"
  >,
  blockType?: ReadingPracticeQuestionType
): number {
  if (question.itemType === "subtitle") return 0;

  if (blockType && INLINE_BLANK_TYPES.has(blockType)) {
    const inlineBlankCount = countInlineBlankPlaceholders(question.prompt || "");
    if (inlineBlankCount === 0) return 0;
  }

  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer.length > 0 ? question.correctAnswer.length : 1;
  }

  return 1;
}

const SUPPORTED_TYPES: ReadingPracticeQuestionType[] = [
  "true-false-not-given",
  "yes-no-not-given",
  "multiple-choice-single",
  "multiple-choice-multi",
  "matching-headings",
  "matching-information",
  "matching-features",
  "fill-in-the-blank",
  "short-answer",
  "sentence-completion",
  "summary-completion",
  "diagram-label-completion",
];

export function validateAndNormalizeReadingBlocks(
  rawBlocks: unknown
): ReadingPracticeValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) {
    return {
      isValid: false,
      errors: ["questionBlocks must be a non-empty array"],
      normalizedBlocks: [],
      totalQuestions: 0,
    };
  }

  const normalizedBlocks: ReadingPracticeBlock[] = rawBlocks.map((rawBlock, blockIndex) => {
    const block = (rawBlock || {}) as Partial<ReadingPracticeBlock>;
    const blockId =
      typeof block.id === "string" && block.id.trim()
        ? block.id.trim()
        : `block_${blockIndex + 1}`;

    if (!block.type || !SUPPORTED_TYPES.includes(block.type)) {
      errors.push(
        `Block ${blockIndex + 1}: unsupported type. Supported types: ${SUPPORTED_TYPES.join(", ")}`
      );
    }

    if (!Array.isArray(block.questions) || block.questions.length === 0) {
      errors.push(`Block ${blockIndex + 1}: questions must be a non-empty array`);
    }

    const normalizedQuestions: ReadingPracticeQuestion[] = (block.questions || []).map(
      (rawQuestion, questionIndex) => {
        const question = (rawQuestion || {}) as Partial<ReadingPracticeQuestion>;
        const itemType =
          question.itemType === "subtitle" ? "subtitle" : "question";
        const questionId =
          typeof question.id === "string" && question.id.trim()
            ? question.id.trim()
            : `${blockId}_q${questionIndex + 1}`;

        if (!question.prompt || typeof question.prompt !== "string") {
          errors.push(
            `Block ${blockIndex + 1}, question ${questionIndex + 1}: prompt is required`
          );
        }

        if (
          itemType !== "subtitle" &&
          (question.correctAnswer === undefined || question.correctAnswer === null)
        ) {
          errors.push(
            `Block ${blockIndex + 1}, question ${questionIndex + 1}: correctAnswer is required`
          );
        }

        return {
          id: questionId,
          itemType,
          prompt: typeof question.prompt === "string" ? question.prompt : "",
          options: Array.isArray(question.options)
            ? question.options.filter((v) => typeof v === "string")
            : undefined,
          correctAnswer: itemType === "subtitle" ? "" : question.correctAnswer,
          acceptableAnswers: Array.isArray(question.acceptableAnswers)
            ? question.acceptableAnswers.filter((v) => typeof v === "string")
            : undefined,
          caseSensitive: Boolean(question.caseSensitive),
          explanation: Array.isArray(question.explanation)
            ? question.explanation.filter((v) => typeof v === "string")
            : typeof question.explanation === "string"
              ? question.explanation
              : undefined,
        };
      }
    );

    return {
      id: blockId,
      type: (block.type as ReadingPracticeQuestionType) || "multiple-choice-single",
      title: typeof block.title === "string" ? block.title : undefined,
      sectionTitle:
        typeof block.sectionTitle === "string" ? block.sectionTitle : undefined,
      instruction:
        typeof block.instruction === "string" ? block.instruction : undefined,
      matchingOptions: Array.isArray(block.matchingOptions)
        ? block.matchingOptions
            .map((v) => (typeof v === "string" ? v.trim() : ""))
            .filter(Boolean)
        : undefined,
      questions: normalizedQuestions,
    };
  });

  const totalQuestions = normalizedBlocks.reduce(
    (sum, block) =>
      sum +
      block.questions.reduce(
        (blockSum, question) =>
          blockSum + countReadingPracticeQuestionUnits(question, block.type),
        0
      ),
    0
  );

  return {
    isValid: errors.length === 0,
    errors,
    normalizedBlocks,
    totalQuestions,
  };
}

export function stripAnswerKeysFromBlocks(
  blocks: ReadingPracticeBlock[]
): Array<Omit<ReadingPracticeBlock, "questions"> & { questions: Array<Omit<ReadingPracticeQuestion, "correctAnswer" | "acceptableAnswers">> }> {
  return blocks.map((block) => ({
    ...block,
    questions: block.questions.map(({ correctAnswer: _a, acceptableAnswers: _b, ...rest }) => rest),
  }));
}
