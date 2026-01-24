import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { hasActiveSubscription } from "@/app/actions/lemonsqueezy";
import { logAIUsage } from "@/lib/ai-logger";
import { getQuestionTypeDetails } from "@/lib/reading-question-types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_DAILY_READING_LIMIT = 3;

interface GenerateReadingRequest {
  collectionId: string;
  selectedWordIds?: string[]; // Optional: specific word IDs to use (max 20)
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  passageType?: "story" | "article" | "essay" | "news";
  questionType?: string; // IELTS question type
  language?: string;
}

interface AIReadingResponse {
  title: string;
  content: string;
  wordsUsed: string[];
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateReadingRequest = await request.json();
    const {
      collectionId,
      selectedWordIds,
      level = "B1",
      passageType = "story",
      questionType = "multiple-choice",
      language = "en",
    } = body;

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 },
      );
    }

    // Validate selectedWordIds if provided
    if (selectedWordIds && selectedWordIds.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 words can be selected" },
        { status: 400 },
      );
    }

    // Check if collection belongs to user and fetch words
    let words: Array<{ id: string; term: string; definition: string }>;

    if (selectedWordIds && selectedWordIds.length > 0) {
      // Fetch only selected words
      const collection = await prisma.collection.findFirst({
        where: { id: collectionId, userId },
        select: { id: true },
      });

      if (!collection) {
        return NextResponse.json(
          { error: "Collection not found" },
          { status: 404 },
        );
      }

      words = await prisma.word.findMany({
        where: {
          id: { in: selectedWordIds },
          collectionId: collectionId,
        },
        select: { id: true, term: true, definition: true },
      });

      if (words.length < 5) {
        return NextResponse.json(
          { error: "At least 5 words must be selected to generate a passage" },
          { status: 400 },
        );
      }
    } else {
      // Fetch all words from collection (original behavior)
      const collection = await prisma.collection.findFirst({
        where: { id: collectionId, userId },
        include: {
          words: {
            select: { id: true, term: true, definition: true },
          },
        },
      });

      if (!collection) {
        return NextResponse.json(
          { error: "Collection not found" },
          { status: 404 },
        );
      }

      if (collection.words.length < 5) {
        return NextResponse.json(
          {
            error:
              "Collection must have at least 5 words to generate a passage",
          },
          { status: 400 },
        );
      }

      words = collection.words;
    }

    // Check if user has active subscription (premium bypass)
    const isPremium = await hasActiveSubscription();

    // Only check limits for free users
    if (!isPremium) {
      // Get current usage count from AILog
      const aiLog = await prisma.aILog.findUnique({
        where: {
          userId_feature: {
            userId,
            feature: "reading",
          },
        },
      });

      const currentUsage = aiLog?.totalTokens || 0;

      // For now, share the same quota with word fill (3 per day total)
      if (currentUsage >= FREE_DAILY_READING_LIMIT) {
        return NextResponse.json(
          {
            error: "Daily limit reached",
            message: `You've reached your daily limit of ${FREE_DAILY_READING_LIMIT} AI generations. Upgrade to premium for unlimited access!`,
            remainingUses: 0,
            isPremium: false,
          },
          { status: 429 },
        );
      }
    }

    // Get word terms for AI prompt
    const wordTerms = words.map((w) => w.term);
    const wordList = wordTerms.slice(0, 30).join(", "); // Use max 30 words

    // Get language name for better AI understanding
    const languageNames: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
      vi: "Vietnamese",
    };
    const languageName = languageNames[language] || "English";

    // Get question type details for AI prompt
    const questionTypeDetails = getQuestionTypeDetails(questionType);
    const questionInstructions =
      questionTypeDetails?.aiPrompt ||
      "Create 5 multiple choice questions with 4 options (A, B, C, D) each.";
    const questionFormat =
      questionTypeDetails?.instructions ||
      "Select the best answer for each question.";

    // Generate reading passage with AI
    const prompt = `Create an engaging ${level} level ${languageName} reading passage (250-350 words) that naturally incorporates these vocabulary words: ${wordList}.

Requirements:
- Title: Engaging and relevant to the content
- Content: Natural, engaging ${passageType} that flows well in ${languageName}
- Use 70-80% of the provided words naturally in context
- Appropriate difficulty for ${level} CEFR level
- Make it interesting and educational

Question Type: ${questionTypeDetails?.label || "Multiple Choice"}
Instructions: ${questionInstructions}

Create 5 questions in ${languageName} following these guidelines:
${questionFormat}

Format as JSON:
{
  "title": "...",
  "content": "...",
  "wordsUsed": ["word1", "word2", ...],
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}

Note: Adapt the question format based on the question type. For True/False/Not Given, use options like "A. True", "B. False", "C. Not Given". For Yes/No/Not Given, use "A. Yes", "B. No", "C. Not Given". For sentence completion or short answer, provide the answer directly in correctAnswer field.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert IELTS Reading test creator and multilingual content specialist. You create authentic reading passages with various question types (Multiple Choice, True/False/Not Given, Matching Headings, Sentence Completion, etc.) for language learners at different proficiency levels. You can create content in multiple languages while maintaining appropriate difficulty levels and authentic IELTS-style questions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    if (completion.usage) {
      await logAIUsage({
        userId,
        feature: "reading-generate",
        model: "gpt-4o-mini",
        inputTokens: completion.usage.prompt_tokens,
        outputTokens: completion.usage.completion_tokens,
      });
    }

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from AI");
    }

    const aiResponse: AIReadingResponse = JSON.parse(responseContent);

    // Validate response structure
    if (
      !aiResponse.title ||
      !aiResponse.content ||
      !aiResponse.wordsUsed ||
      !aiResponse.questions ||
      aiResponse.questions.length !== 5
    ) {
      throw new Error("Invalid AI response structure");
    }

    // Calculate word count and estimated reading time
    const wordCount = aiResponse.content.split(/\s+/).length;
    const estimatedTime = Math.ceil(wordCount / 200); // Average reading speed

    // Save passage to database
    const savedPassage = await prisma.readingPassage.create({
      data: {
        userId,
        collectionId,
        title: aiResponse.title,
        content: aiResponse.content,
        level,
        wordCount,
        estimatedTime,
        wordsUsed: aiResponse.wordsUsed,
        questions: aiResponse.questions,
      },
    });

    // Update usage tracking (only for free users)
    let remainingUses = -1; // -1 means unlimited for premium

    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Log this AI usage
      await prisma.aILog.upsert({
        where: {
          userId_feature: {
            userId,
            feature: "reading",
          },
        },
        update: {
          totalTokens: {
            increment: 1,
          },
        },
        create: {
          userId,
          feature: "reading",
          model: "gpt-4o-mini",
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 1, // Use totalTokens as counter
          cost: 0,
        },
      });

      // Get updated count
      const aiLog = await prisma.aILog.findUnique({
        where: {
          userId_feature: {
            userId,
            feature: "reading",
          },
        },
      });

      remainingUses = FREE_DAILY_READING_LIMIT - (aiLog?.totalTokens || 0);
    }

    return NextResponse.json({
      success: true,
      data: savedPassage,
      isPremium,
      remainingUses: isPremium ? -1 : remainingUses,
      message: isPremium
        ? "Unlimited reading passages available"
        : remainingUses > 0
          ? `${remainingUses} reading passage${
              remainingUses === 1 ? "" : "s"
            } remaining today`
          : "Last free reading passage for today! Upgrade for unlimited access.",
    });
  } catch (error: any) {
    console.error("Reading generation error:", error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key" },
        { status: 500 },
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "AI service rate limit reached. Please try again later." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate reading passage",
        message: error.message || "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

// GET: Fetch user's reading passages
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get("collectionId");

    const passages = await prisma.readingPassage.findMany({
      where: {
        userId,
        ...(collectionId ? { collectionId } : {}),
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: passages,
    });
  } catch (error: any) {
    console.error("Fetch passages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading passages" },
      { status: 500 },
    );
  }
}
