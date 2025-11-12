import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { hasActiveSubscription } from "@/app/actions/lemonsqueezy";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_DAILY_LIMIT = 3;

interface AIFillResponse {
  term: string;
  definition: string;
  example: string;
  phonetic: string;
  partOfSpeech: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { term } = body;

    if (!term || typeof term !== "string" || term.trim().length === 0) {
      return NextResponse.json({ error: "Term is required" }, { status: 400 });
    }

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

      // Check if user exceeded free limit
      if (currentUsage >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: "Daily limit reached",
            message: `You've reached your daily limit of ${FREE_DAILY_LIMIT} AI fills. Upgrade to premium for unlimited access!`,
            remainingUses: 0,
            isPremium: false,
          },
          { status: 429 }
        );
      }
    }

    // Call OpenAI API with gpt-4o-mini (cheapest and efficient)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful English language assistant. Given a word, phrase, or idiom, provide:
1. The term (cleaned up if needed)
2. A clear, concise definition
3. A natural example sentence using the term
4. Phonetic pronunciation (IPA format)
5. Part of speech (noun, verb, adjective, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "term": "the word/phrase",
  "definition": "clear definition",
  "example": "example sentence using the term",
  "phonetic": "/pronunciation/",
  "partOfSpeech": "noun|verb|adjective|etc"
}

Keep definitions concise and examples natural. If it's a phrase or idiom, mark partOfSpeech as "phrase" or "idiom".`,
        },
        {
          role: "user",
          content: `Provide information for: ${term.trim()}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    const aiResponse: AIFillResponse = JSON.parse(responseContent);

    // Validate response structure
    if (
      !aiResponse.term ||
      !aiResponse.definition ||
      !aiResponse.example ||
      !aiResponse.phonetic ||
      !aiResponse.partOfSpeech
    ) {
      throw new Error("Invalid AI response structure");
    }

    // Update usage tracking (only for free users)
    let remainingUses = -1; // -1 means unlimited for premium

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
      data: aiResponse,
      isPremium,
      remainingUses: isPremium ? -1 : remainingUses,
      message: isPremium
        ? "Unlimited AI fills available"
        : remainingUses > 0
        ? `${remainingUses} AI fill${
            remainingUses === 1 ? "" : "s"
          } remaining today`
        : "Last AI fill for today! Upgrade for unlimited access.",
    });
  } catch (error: any) {
    console.error("AI Fill Error:", error);

    // Handle OpenAI specific errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key" },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "OpenAI rate limit reached. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate AI content",
        message: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check remaining usage
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is premium
    const isPremium = await hasActiveSubscription();

    if (isPremium) {
      return NextResponse.json({
        isPremium: true,
        remainingUses: -1, // -1 indicates unlimited
        totalLimit: -1,
        used: 0,
        canUse: true,
        message: "Unlimited AI fills available",
      });
    }

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
    const remainingUses = Math.max(0, FREE_DAILY_LIMIT - currentUsage);

    return NextResponse.json({
      isPremium: false,
      remainingUses,
      totalLimit: FREE_DAILY_LIMIT,
      used: currentUsage,
      canUse: currentUsage < FREE_DAILY_LIMIT,
    });
  } catch (error: any) {
    console.error("Check usage error:", error);
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    );
  }
}
