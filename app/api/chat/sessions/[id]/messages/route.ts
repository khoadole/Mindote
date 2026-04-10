import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { hasActiveSubscription } from "@/app/actions/lemonsqueezy";
import { logAIUsage } from "@/lib/ai-logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FREE_DAILY_LIMIT = 5;
const MAX_CONTEXT_MESSAGES = 12;
const MAX_OUTPUT_TOKENS = 500;

const SYSTEM_PROMPT = `You are Mindote, a friendly AI assistant built into the Mindote app.

Primary responsibilities:
- English learning support:
  - Vocabulary (meanings, usage, CEFR levels, examples, synonyms, collocations)
  - Grammar (rules, explanations, corrections, examples)
  - Writing practice and improvement tips
  - Reading comprehension and passage analysis
  - Pronunciation and study strategies
- Mindote app support:
  - Explain how app features work (flashcards with SRS, quiz, writing, reading, vocabulary browser)
  - Help with account/subscription basics and usage limits
  - Answer personal app-stat questions when real-time context is provided

STRICT RULES:
- ONLY answer questions about English learning or Mindote app/account support.
- If a question is outside this scope (coding, politics, general news, etc.), politely decline and redirect.
- Respond in the same language the user writes in.
- Keep responses concise, practical, and supportive.
- Use markdown for clarity when helpful.
- If the user asks for personal numbers/status (word count, collections, streak, plan, remaining uses), use ONLY values from USER APP CONTEXT.
- For numeric/stat questions, answer directly with the exact number first, then add a short explanation.
- Never invent personal data. If context is missing, say you cannot verify and guide user to /settings.
- If a word preview is provided in USER APP CONTEXT, you may use it to answer "which words" questions.
- If the user asks for a complete/full word list beyond preview, provide what is available and guide them to /collections.
- For account/payment problems that cannot be verified from context, give safe troubleshooting steps and suggest checking /settings.`;

function buildUserContextPrompt(params: {
  totalWords: number;
  totalCollections: number;
  totalReadingPassages: number;
  currentStreak: number;
  longestStreak: number;
  isPremium: boolean;
  remainingUses: number;
  previewWords: Array<{ term: string; collectionName: string }>;
}) {
  const {
    totalWords,
    totalCollections,
    totalReadingPassages,
    currentStreak,
    longestStreak,
    isPremium,
    remainingUses,
    previewWords,
  } = params;

  const lines = [
    "USER APP CONTEXT (REAL-TIME, TRUSTED)",
    `- total_words: ${totalWords}`,
    `- total_collections: ${totalCollections}`,
    `- total_reading_passages: ${totalReadingPassages}`,
    `- current_streak_days: ${currentStreak}`,
    `- longest_streak_days: ${longestStreak}`,
    `- is_premium: ${isPremium}`,
    `- remaining_free_chat_uses_after_this_message: ${remainingUses}`,
  ];

  if (previewWords.length > 0) {
    lines.push(
      `- recent_words_preview_count: ${previewWords.length}`,
      `- recent_words_preview: ${previewWords
        .map((w) => `${w.term} (${w.collectionName})`)
        .join(", ")}`
    );
  }

  lines.push(
    "- notes:",
    "  - if is_premium=true, chat usage is unlimited",
    "  - settings page path is /settings",
    "  - collections page path is /collections",
    "  - reading page path is /reading"
  );

  return lines.join("\n");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestStartedAt = Date.now();
    const userId = await getUserId();
    const { id: sessionId } = await params;

    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body as { content: string };

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const trimmed = content.trim();
    if (trimmed.length > 500) {
      return NextResponse.json(
        { error: "Message too long. Please keep it under 500 characters." },
        { status: 400 }
      );
    }

    const normalizedMessage = trimmed
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const needsWordPreview =
      /\b(word|words|vocab|vocabulary|word list|which words)\b/i.test(trimmed) ||
      /(tu\s+nao|cac\s+tu|danh\s+sach\s+tu|tu\s+vung)/i.test(normalizedMessage);

    const recentMessagesPromise = prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: MAX_CONTEXT_MESSAGES,
    });

    const statsPromise = prisma.$transaction([
      prisma.collection.count({ where: { userId } }),
      prisma.word.count({ where: { collection: { userId } } }),
      prisma.readingPassage.count({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true },
      }),
    ]);

    const previewWordsPromise = needsWordPreview
      ? prisma.word.findMany({
          where: { collection: { userId } },
          orderBy: { updatedAt: "desc" },
          take: 12,
          select: {
            term: true,
            collection: {
              select: { name: true },
            },
          },
        })
      : Promise.resolve([] as Array<{ term: string; collection: { name: string } }>);

    // Check rate limit
    const [isPremium, recentMessages, statsResult, previewWordsRaw] = await Promise.all([
      hasActiveSubscription(),
      recentMessagesPromise,
      statsPromise,
      previewWordsPromise,
    ]);

    let remainingUses = -1;

    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usage = await prisma.chatUsage.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      const currentCount = usage?.count ?? 0;

      if (currentCount >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: "Daily limit reached",
            message: `You've used all ${FREE_DAILY_LIMIT} free chat messages today. Upgrade to premium for unlimited access!`,
            remainingUses: 0,
            isPremium: false,
          },
          { status: 429 }
        );
      }

      remainingUses = FREE_DAILY_LIMIT - currentCount - 1;
    }

    // Build real-time user context so the assistant can answer account/stat questions accurately.
    const [totalCollections, totalWords, totalReadingPassages, userProfile] = statsResult;

    const previewWords = previewWordsRaw.map((w) => ({
      term: w.term,
      collectionName: w.collection.name,
    }));

    const contextPrompt = buildUserContextPrompt({
      totalWords,
      totalCollections,
      totalReadingPassages,
      currentStreak: userProfile?.currentStreak ?? 0,
      longestStreak: userProfile?.longestStreak ?? 0,
      isPremium,
      remainingUses,
      previewWords,
    });

    const conversationHistory = recentMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call OpenAI
    const openAiStartedAt = Date.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextPrompt}` },
        ...conversationHistory,
        { role: "user", content: trimmed },
      ],
      temperature: 0.5,
      max_tokens: MAX_OUTPUT_TOKENS,
    });
    const openAiDurationMs = Date.now() - openAiStartedAt;

    const assistantContent = completion.choices[0]?.message?.content;
    if (!assistantContent) {
      throw new Error("No response from AI");
    }

    // Save both messages
    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: { sessionId, role: "user", content: trimmed },
      }),
      prisma.chatMessage.create({
        data: { sessionId, role: "assistant", content: assistantContent },
      }),
    ]);

    // Update session updatedAt
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    // Log AI usage
    if (completion.usage) {
      await logAIUsage({
        userId,
        feature: "chatbot",
        model: "gpt-4o-mini",
        inputTokens: completion.usage.prompt_tokens,
        outputTokens: completion.usage.completion_tokens,
      });
    }

    // Increment daily chat usage for free users
    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.chatUsage.upsert({
        where: { userId_date: { userId, date: today } },
        update: { count: { increment: 1 } },
        create: { userId, date: today, count: 1 },
      });
    }

    const totalDurationMs = Date.now() - requestStartedAt;

    const response = NextResponse.json({
      userMessage,
      assistantMessage,
      remainingUses: isPremium ? -1 : remainingUses,
      isPremium,
    });

    response.headers.set(
      "Server-Timing",
      `openai;dur=${openAiDurationMs},total;dur=${totalDurationMs}`
    );

    return response;
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };

    if (err?.status === 429) {
      return NextResponse.json(
        { error: "AI service rate limit reached. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send message", message: err?.message },
      { status: 500 }
    );
  }
}
