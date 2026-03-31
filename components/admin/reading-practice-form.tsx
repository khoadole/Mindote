"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ReadingPracticePart } from "@/hooks/use-reading-practice";
import type {
  ReadingPracticeBlock,
  ReadingPracticeQuestion,
  ReadingPracticeQuestionType,
} from "@/lib/reading-practice-types";

const BLOCK_SAMPLE: ReadingPracticeBlock[] = [
  {
    id: "tfng_block_1",
    type: "true-false-not-given",
    title: "Questions 1-3",
    instruction: "Choose TRUE, FALSE or NOT GIVEN.",
    questions: [
      {
        id: "q1",
        prompt: "The writer believes solar energy is always cheap.",
        options: ["TRUE", "FALSE", "NOT GIVEN"],
        correctAnswer: "FALSE",
        explanation: "The passage says initial setup can be expensive.",
      },
    ],
  },
  {
    id: "mc_multi_1",
    type: "multiple-choice-multi",
    title: "Questions 4-5",
    instruction: "Choose TWO letters, A-E.",
    questions: [
      {
        id: "q4",
        prompt: "Which TWO benefits are mentioned?",
        options: ["A. lower bills", "B. free batteries", "C. cleaner air", "D. less sunlight", "E. shorter nights"],
        correctAnswer: ["A", "C"],
      },
    ],
  },
  {
    id: "summary_1",
    type: "summary-completion",
    title: "Questions 6-7",
    instruction: "Complete the summary with NO MORE THAN TWO WORDS.",
    questions: [
      {
        id: "q6",
        prompt: "Most homes install panels on the ______.",
        correctAnswer: "roof",
        acceptableAnswers: ["roofs"],
      },
    ],
  },
];

const BLOCK_TYPE_OPTIONS: Array<{
  value: ReadingPracticeQuestionType;
  label: string;
}> = [
  { value: "true-false-not-given", label: "True / False / Not Given" },
  { value: "yes-no-not-given", label: "Yes / No / Not Given" },
  { value: "multiple-choice-single", label: "Multiple Choice (Single)" },
  { value: "multiple-choice-multi", label: "Multiple Choice (Multi)" },
  { value: "matching-headings", label: "Matching Headings" },
  { value: "matching-information", label: "Matching Information" },
  { value: "matching-features", label: "Matching Features" },
  { value: "fill-in-the-blank", label: "Fill in the blank" },
  { value: "short-answer", label: "Short Answer" },
  { value: "sentence-completion", label: "Sentence Completion" },
  { value: "summary-completion", label: "Summary/Note/Table/Flowchart" },
  { value: "diagram-label-completion", label: "Diagram Label Completion" },
];

const OPTION_TYPES: ReadingPracticeQuestionType[] = [
  "true-false-not-given",
  "yes-no-not-given",
  "multiple-choice-single",
  "multiple-choice-multi",
];

const MATCHING_TYPES: ReadingPracticeQuestionType[] = [
  "matching-headings",
  "matching-information",
  "matching-features",
];

const INLINE_BLANK_TYPES: ReadingPracticeQuestionType[] = [
  "fill-in-the-blank",
  "sentence-completion",
  "summary-completion",
  "diagram-label-completion",
];

function buildId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function getDefaultQuestion(type: ReadingPracticeQuestionType): ReadingPracticeQuestion {
  const id = buildId("q");

  if (type === "true-false-not-given") {
    return {
      id,
      itemType: "question",
      prompt: "",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      correctAnswer: "TRUE",
      explanation: "",
    };
  }

  if (type === "yes-no-not-given") {
    return {
      id,
      itemType: "question",
      prompt: "",
      options: ["YES", "NO", "NOT GIVEN"],
      correctAnswer: "YES",
      explanation: "",
    };
  }

  if (type === "multiple-choice-single") {
    return {
      id,
      itemType: "question",
      prompt: "",
      options: ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      correctAnswer: "A",
      explanation: "",
    };
  }

  if (type === "multiple-choice-multi") {
    return {
      id,
      itemType: "question",
      prompt: "",
      options: [
        "A. Option 1",
        "B. Option 2",
        "C. Option 3",
        "D. Option 4",
        "E. Option 5",
      ],
      correctAnswer: ["A", "B"],
      explanation: "",
    };
  }

  if (MATCHING_TYPES.includes(type)) {
    return {
      id,
      itemType: "question",
      prompt: "",
      correctAnswer: { "1": "A" },
      explanation: "",
    };
  }

  return {
    id,
    itemType: "question",
    prompt: "",
    correctAnswer: "",
    acceptableAnswers: [],
    explanation: "",
  };
}

function getDefaultSubtitle(): ReadingPracticeQuestion {
  return {
    id: buildId("sub"),
    itemType: "subtitle",
    prompt: "New subtitle",
    correctAnswer: "",
  };
}

function getDefaultInstructionByType(type: ReadingPracticeQuestionType): string {
  if (type === "true-false-not-given") {
    return [
      "Do the following statements agree with the information given in this Passage?",
      "In the following statements below, choose",
      "**TRUE**                   if the statement agrees with the information",
      "**FALSE**                  if the statement contradicts the information",
      "**NOT GIVEN**         if it is impossible to say what the writer thinks about this",
    ].join("\n");
  }

  if (type === "fill-in-the-blank") {
    return [
      "Complete the notes below.",
      "Choose **ONE WORD AND/OR A NUMBER** from the passage for each answer.",
    ].join("\n");
  }

  return "";
}

function getDefaultBlock(type: ReadingPracticeQuestionType): ReadingPracticeBlock {
  return {
    id: buildId("block"),
    type,
    title: "",
    instruction: getDefaultInstructionByType(type),
    questions: [getDefaultQuestion(type)],
  };
}

function safeBlocks(input: unknown): ReadingPracticeBlock[] {
  if (!Array.isArray(input) || input.length === 0) {
    return BLOCK_SAMPLE;
  }
  return input as ReadingPracticeBlock[];
}

function correctAnswerToEditorText(question: ReadingPracticeQuestion): string {
  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer.map((v) => String(v)).join(", ");
  }

  if (
    question.correctAnswer &&
    typeof question.correctAnswer === "object" &&
    !Array.isArray(question.correctAnswer)
  ) {
    return Object.entries(question.correctAnswer as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join("\n");
  }

  return String(question.correctAnswer || "");
}

interface ReadingPracticeFormProps {
  initialValues?: Partial<ReadingPracticePart>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ReadingPracticeForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel = "Save",
}: ReadingPracticeFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [examTitle, setExamTitle] = useState(initialValues?.examTitle || "");
  const [examCode, setExamCode] = useState(initialValues?.examCode || "");
  const [partNumber, setPartNumber] = useState(initialValues?.partNumber || 1);
  const [title, setTitle] = useState(initialValues?.title || "");
  const [passageSubtitle, setPassageSubtitle] = useState(
    initialValues?.passageSubtitle || ""
  );
  const [content, setContent] = useState(initialValues?.content || "");
  const [instructions, setInstructions] = useState(initialValues?.instructions || "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialValues?.estimatedMinutes || 20
  );
  const [level, setLevel] = useState(initialValues?.level || "");
  const [displayOrder, setDisplayOrder] = useState(initialValues?.displayOrder || 0);
  const [tagsText, setTagsText] = useState((initialValues?.tags || []).join(", "));
  const [isPublished, setIsPublished] = useState(
    initialValues?.status === "PUBLISHED"
  );
  const [blocks, setBlocks] = useState<ReadingPracticeBlock[]>(() =>
    safeBlocks(initialValues?.questionBlocks)
  );
  const [advancedMode, setAdvancedMode] = useState(false);

  function addBlock(type: ReadingPracticeQuestionType) {
    setBlocks((prev) => [...prev, getDefaultBlock(type)]);
  }

  function removeBlock(blockId: string) {
    setBlocks((prev) => prev.filter((block) => block.id !== blockId));
  }

  function updateBlock(blockId: string, patch: Partial<ReadingPracticeBlock>) {
    setBlocks((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, ...patch } : block))
    );
  }

  function changeBlockType(blockId: string, nextType: ReadingPracticeQuestionType) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        const defaultInstruction = getDefaultInstructionByType(nextType);
        return {
          ...block,
          type: nextType,
          instruction: block.instruction?.trim()
            ? block.instruction
            : defaultInstruction,
          questions: block.questions.map((question) => ({
            ...getDefaultQuestion(nextType),
            id: question.id,
            prompt: question.prompt,
          })),
        };
      })
    );
  }

  function addQuestion(blockId: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          questions: [...block.questions, getDefaultQuestion(block.type)],
        };
      })
    );
  }

  function addSubtitle(blockId: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          questions: [...block.questions, getDefaultSubtitle()],
        };
      })
    );
  }

  function addSubtitleAbove(blockId: string, questionId: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        const index = block.questions.findIndex((q) => q.id === questionId);
        if (index < 0) return block;

        const subtitle = getDefaultSubtitle();
        const nextQuestions = [...block.questions];
        nextQuestions.splice(index, 0, subtitle);

        return {
          ...block,
          questions: nextQuestions,
        };
      })
    );
  }

  function removeQuestion(blockId: string, questionId: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          questions: block.questions.filter((question) => question.id !== questionId),
        };
      })
    );
  }

  function updateQuestion(
    blockId: string,
    questionId: string,
    patch: Partial<ReadingPracticeQuestion>
  ) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          questions: block.questions.map((question) =>
            question.id === questionId ? { ...question, ...patch } : question
          ),
        };
      })
    );
  }

  function parseCorrectAnswer(
    type: ReadingPracticeQuestionType,
    text: string
  ): unknown {
    if (type === "multiple-choice-multi") {
      return text
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (MATCHING_TYPES.includes(type)) {
      const map: Record<string, string> = {};
      text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          const separatorIndex = line.indexOf(":") >= 0 ? line.indexOf(":") : line.indexOf("=");
          if (separatorIndex <= 0) return;
          const key = line.slice(0, separatorIndex).trim();
          const value = line.slice(separatorIndex + 1).trim();
          if (key && value) {
            map[key] = value;
          }
        });
      return map;
    }

    return text.trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (blocks.length === 0) {
      toast({
        title: "No question blocks",
        description: "Please add at least one question block.",
        variant: "destructive",
      });
      return;
    }

    const hasEmptyQuestionList = blocks.some((block) => block.questions.length === 0);
    if (hasEmptyQuestionList) {
      toast({
        title: "Empty block detected",
        description: "Each block must contain at least one question.",
        variant: "destructive",
      });
      return;
    }

    await onSubmit({
      examTitle,
      examCode: examCode || null,
      partNumber,
      title,
      passageSubtitle: passageSubtitle || null,
      content,
      instructions: instructions || null,
      estimatedMinutes,
      level: level || null,
      displayOrder,
      tags: tagsText
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      status: isPublished ? "PUBLISHED" : "DRAFT",
      questionBlocks: blocks,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="examTitle">Exam Title *</Label>
          <Input
            id="examTitle"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            placeholder="Cambridge 20 Test 1"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="examCode">Exam Code</Label>
          <Input
            id="examCode"
            value={examCode}
            onChange={(e) => setExamCode(e.target.value)}
            placeholder="CAM20-T1"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="partNumber">Part *</Label>
          <Input
            id="partNumber"
            type="number"
            min={1}
            max={3}
            value={partNumber}
            onChange={(e) => setPartNumber(Number(e.target.value) || 1)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
          <Input
            id="estimatedMinutes"
            type="number"
            min={1}
            max={120}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value) || 20)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Part Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Part 1 - Urban Energy"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="passageSubtitle">Passage Subtitle (optional)</Label>
        <Input
          id="passageSubtitle"
          value={passageSubtitle}
          onChange={(e) => setPassageSubtitle(e.target.value)}
          placeholder="The kakapo"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Passage Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="instructions">General Instructions</Label>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="B1/B2/C1..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="science, environment"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Question Blocks Builder *</Label>
          <div className="flex items-center gap-2">
            <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
            <span className="text-xs text-muted-foreground">Advanced JSON</span>
          </div>
        </div>

        <div className="space-y-3">
          {blocks.map((block, blockIndex) => (
            <div key={block.id} className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Block {blockIndex + 1}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeBlock(block.id)}
                  disabled={blocks.length <= 1}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove Block
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={block.type}
                    onValueChange={(value) =>
                      changeBlockType(block.id, value as ReadingPracticeQuestionType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCK_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Block Title</Label>
                  <Input
                    value={block.title || ""}
                    onChange={(e) =>
                      updateBlock(block.id, { title: e.target.value })
                    }
                    placeholder="Questions 1-5"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Instruction</Label>
                <Textarea
                  rows={4}
                  value={block.instruction || ""}
                  onChange={(e) =>
                    updateBlock(block.id, { instruction: e.target.value })
                  }
                  placeholder={"Write instruction for this question block\nYou can use multiple lines here."}
                />
              </div>

              {INLINE_BLANK_TYPES.includes(block.type) && (
                <div className="space-y-1.5">
                  <Label>Section Title (centered, optional)</Label>
                  <Input
                    value={block.sectionTitle || ""}
                    onChange={(e) =>
                      updateBlock(block.id, { sectionTitle: e.target.value })
                    }
                    placeholder="New Zealand's kakapo"
                  />
                </div>
              )}

              <div className="space-y-3">
                {(() => {
                  let subtitleCount = 0;
                  let questionCount = 0;

                  return block.questions.map((question) => {
                    if (question.itemType === "subtitle") {
                      subtitleCount += 1;
                    } else {
                      questionCount += 1;
                    }

                    return (
                  <div key={question.id} className="rounded-md border p-3 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {question.itemType === "subtitle"
                          ? `Sub Title ${subtitleCount}`
                          : `Question ${questionCount}`}
                      </div>
                      <div className="flex items-center gap-2">
                        {question.itemType !== "subtitle" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addSubtitleAbove(block.id, question.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Sub Title Above
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(block.id, question.id)}
                          disabled={block.questions.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    {question.itemType === "subtitle" ? (
                      <div className="space-y-1.5">
                        <Label>Sub Title</Label>
                        <Input
                          value={question.prompt}
                          onChange={(e) =>
                            updateQuestion(block.id, question.id, { prompt: e.target.value })
                          }
                          placeholder="A type of parrot:"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <Label>Prompt</Label>
                          <Textarea
                            rows={2}
                            value={question.prompt}
                            onChange={(e) =>
                              updateQuestion(block.id, question.id, { prompt: e.target.value })
                            }
                            placeholder="Enter question prompt"
                          />
                          {INLINE_BLANK_TYPES.includes(block.type) && (
                            <p className="text-xs text-muted-foreground">
                              For inline blank display, add a placeholder in prompt like "____" or
                              "[blank]" where the input should appear.
                            </p>
                          )}
                        </div>

                        {OPTION_TYPES.includes(block.type) &&
                          block.type !== "true-false-not-given" &&
                          block.type !== "yes-no-not-given" && (
                          <div className="space-y-1.5">
                            <Label>Options (one option per line)</Label>
                            <Textarea
                              rows={4}
                              value={(question.options || []).join("\n")}
                              onChange={(e) =>
                                updateQuestion(block.id, question.id, {
                                  options: e.target.value
                                    .split("\n")
                                    .map((v) => v.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="A. ...\nB. ...\nC. ..."
                            />
                          </div>
                        )}

                        {(block.type === "true-false-not-given" ||
                          block.type === "yes-no-not-given") && (
                          <div className="space-y-1.5">
                            <Label>Options</Label>
                            <Input
                              value={
                                block.type === "true-false-not-given"
                                  ? "TRUE / FALSE / NOT GIVEN"
                                  : "YES / NO / NOT GIVEN"
                              }
                              readOnly
                            />
                          </div>
                        )}

                        {(block.type === "true-false-not-given" ||
                          block.type === "yes-no-not-given") ? (
                          <div className="space-y-1.5">
                            <Label>Correct Answer</Label>
                            <Select
                              value={String(question.correctAnswer || "")}
                              onValueChange={(value) =>
                                updateQuestion(block.id, question.id, { correctAnswer: value })
                              }
                            >
                              <SelectTrigger className="max-w-[280px]">
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                              <SelectContent>
                                {(block.type === "true-false-not-given"
                                  ? ["TRUE", "FALSE", "NOT GIVEN"]
                                  : ["YES", "NO", "NOT GIVEN"]
                                ).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Label>
                              Correct Answer
                              {block.type === "multiple-choice-multi"
                                ? " (comma-separated, e.g. A, C)"
                                : MATCHING_TYPES.includes(block.type)
                                  ? " (one pair per line: key: value)"
                                  : ""}
                            </Label>
                            <Textarea
                              rows={MATCHING_TYPES.includes(block.type) ? 4 : 2}
                              value={correctAnswerToEditorText(question)}
                              onChange={(e) =>
                                updateQuestion(block.id, question.id, {
                                  correctAnswer: parseCorrectAnswer(block.type, e.target.value),
                                })
                              }
                              placeholder={
                                MATCHING_TYPES.includes(block.type)
                                  ? "1: A\n2: C"
                                  : block.type === "multiple-choice-multi"
                                    ? "A, C"
                                    : "Correct answer"
                              }
                            />
                          </div>
                        )}

                        {!OPTION_TYPES.includes(block.type) && (
                          <div className="space-y-1.5">
                            <Label>Acceptable Answers (comma-separated, optional)</Label>
                            <Input
                              value={(question.acceptableAnswers || []).join(", ")}
                              onChange={(e) =>
                                updateQuestion(block.id, question.id, {
                                  acceptableAnswers: e.target.value
                                    .split(",")
                                    .map((v) => v.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="synonym 1, synonym 2"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label>Explanation (optional)</Label>
                          <Textarea
                            rows={2}
                            value={question.explanation || ""}
                            onChange={(e) =>
                              updateQuestion(block.id, question.id, {
                                explanation: e.target.value,
                              })
                            }
                            placeholder="Why this answer is correct"
                          />
                        </div>
                      </>
                    )}
                  </div>
                    );
                  });
                })()}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion(block.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Question
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSubtitle(block.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sub Title
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            {BLOCK_TYPE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock(option.value)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {option.label}
              </Button>
            ))}
          </div>

          {advancedMode && (
            <div className="space-y-1.5">
              <Label>JSON Preview (read-only)</Label>
              <Textarea
                rows={14}
                value={JSON.stringify(blocks, null, 2)}
                readOnly
                className="font-mono text-xs"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        <Label>Published</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/reading")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
