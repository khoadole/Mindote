import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { hasActiveSubscription } from "@/app/actions/lemonsqueezy";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_DAILY_LIMIT = 3;
const MAX_WORDS = 15;

interface ExtractedWord {
  term: string;
  definition: string;
  example: string;
  partOfSpeech: string;
  phonetic: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      transcript,
      level = "B1",
      wordCount = 10,
      nativeLanguage = "en",
    } = body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: "Transcript must be at least 50 characters" },
        { status: 400 }
      );
    }

    // Validate word count (max 15)
    const requestedWords = Math.min(Math.max(1, wordCount), MAX_WORDS);

    // Check if user has active subscription (premium bypass)
    const isPremium = await hasActiveSubscription();

    // Only check limits for free users
    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usage = await prisma.aIUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      const currentUsage = usage?.count || 0;

      if (currentUsage >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: "Daily limit reached",
            message: `You've reached your daily limit of ${FREE_DAILY_LIMIT} AI extractions. Upgrade to premium for unlimited access!`,
            remainingUses: 0,
            isPremium: false,
          },
          { status: 429 }
        );
      }
    }

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
    const nativeLangName = languageNames[nativeLanguage] || "English";

    // Truncate transcript if too long (max 3000 chars for cost efficiency)
    const truncatedTranscript = transcript.slice(0, 3000);

    // Call OpenAI to extract vocabulary
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a vocabulary extraction expert. Analyze the transcript and extract ${requestedWords} vocabulary words that are:
1. Appropriate for ${level} CEFR level learners
2. Useful and commonly used
3. Not too basic (like "the", "is", "a")

For each word, provide:
- term: The word/phrase as it appears
- phonetic: IPA pronunciation (e.g., /prəˌnʌnsiˈeɪʃən/)
- definition: Clear definition in ${nativeLangName}
- example: A sentence from the transcript using this word (or create one if not clearly available)
- partOfSpeech: noun, verb, adjective, adverb, phrase, etc.

IMPORTANT:
- Extract exactly ${requestedWords} words
- Definitions MUST be in ${nativeLangName}
- Phonetic transcription MUST use IPA format
- Focus on words that match ${level} level difficulty:
  * A1-A2: Basic everyday words
  * B1-B2: Common but more sophisticated vocabulary
  * C1-C2: Advanced/academic vocabulary

Respond ONLY with valid JSON:
{
  "words": [
    {
      "term": "...",
      "phonetic": "/.../ (IPA format)",
      "definition": "... (in ${nativeLangName})",
      "example": "...",
      "partOfSpeech": "..."
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Extract ${requestedWords} vocabulary words at ${level} level from this transcript:\n\n${truncatedTranscript}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from AI");
    }

    const aiResponse = JSON.parse(responseContent);

    if (!aiResponse.words || !Array.isArray(aiResponse.words)) {
      throw new Error("Invalid AI response structure");
    }

    // Update usage tracking (only for free users)
    let remainingUses = -1;

    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usage = await prisma.aIUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      const currentUsage = usage?.count || 0;

      await prisma.aIUsage.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          userId,
          date: today,
          count: 1,
        },
      });

      remainingUses = FREE_DAILY_LIMIT - (currentUsage + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        words: aiResponse.words as ExtractedWord[],
        level,
        wordCount: aiResponse.words.length,
      },
      isPremium,
      remainingUses: isPremium ? -1 : remainingUses,
    });
  } catch (error: any) {
    console.error("AI Extract Error:", error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key" },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "AI rate limit reached. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to extract vocabulary",
        message: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
