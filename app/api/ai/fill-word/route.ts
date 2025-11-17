import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { hasActiveSubscription } from "@/app/actions/lemonsqueezy";
import { getLanguageByCode, DEFAULT_LANGUAGE } from "@/lib/languages";

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
    const {
      term,
      termLanguage = DEFAULT_LANGUAGE,
      definitionLanguage = DEFAULT_LANGUAGE,
      exampleLanguage = DEFAULT_LANGUAGE,
    } = body;

    if (!term || typeof term !== "string" || term.trim().length === 0) {
      return NextResponse.json({ error: "Term is required" }, { status: 400 });
    }

    // Get language names for better AI prompts
    const termLang = getLanguageByCode(termLanguage);
    const defLang = getLanguageByCode(definitionLanguage);
    const exampleLang = getLanguageByCode(exampleLanguage);

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

    // Get appropriate phonetic format based on term language
    const getPhoneticInstruction = (langCode: string) => {
      switch (langCode) {
        case "zh":
          return "Pinyin with tone marks (e.g., píngguǒ)";
        case "ja":
          return "Hiragana/Katakana reading and Romaji (e.g., りんご / ringo)";
        case "ko":
          return "Hangul pronunciation and Romanization (e.g., 사과 / sagwa)";
        case "vi":
          return "Vietnamese pronunciation with tone marks (e.g., táo)";
        case "ru":
          return "Cyrillic pronunciation guide";
        case "ar":
          return "Arabic transliteration";
        default:
          return "IPA format (e.g., /ˈæpəl/)";
      }
    };

    const phoneticFormat = getPhoneticInstruction(termLanguage);

    // Call OpenAI API with gpt-4o-mini (cheapest and efficient)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful multilingual language assistant. Given a word, phrase, or idiom, provide:
1. The term (cleaned up if needed) in ${termLang?.name || "English"}
2. A clear, concise definition in ${defLang?.name || "English"}
3. A natural example sentence in ${
            exampleLang?.name || "English"
          } using the term
4. Phonetic pronunciation for the term in the appropriate format for ${
            termLang?.name || "English"
          }
5. Part of speech (noun, verb, adjective, etc.)

IMPORTANT LANGUAGE INSTRUCTIONS:
- The TERM should be in ${termLang?.name || "English"}
- The DEFINITION must be written entirely in ${defLang?.name || "English"}
- The EXAMPLE sentence must be written entirely in ${
            exampleLang?.name || "English"
          }
- Keep the term in the example sentence even if the example is in a different language

PHONETIC FORMAT FOR ${termLang?.name || "English"}:
- Use ${phoneticFormat}
- Examples:
  * Chinese (中文): 苹果 → píngguǒ
  * Japanese (日本語): りんご → ringo or りんご
  * Korean (한국어): 사과 → sagwa
  * Vietnamese: táo (with tone marks)
  * English/Spanish/French/German/Italian/Portuguese: IPA format (e.g., /ˈæpəl/)

Respond ONLY with valid JSON in this exact format:
{
  "term": "the word/phrase in ${termLang?.name}",
  "definition": "clear definition in ${defLang?.name}",
  "example": "example sentence in ${exampleLang?.name} using the term",
  "phonetic": "pronunciation in appropriate format for ${termLang?.name}",
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
