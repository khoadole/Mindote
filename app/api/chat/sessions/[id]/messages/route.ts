import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { hasActiveSubscription } from "@/app/actions/lemonsqueezy";
import { logAIUsage } from "@/lib/ai-logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FREE_DAILY_LIMIT = 5;

const SYSTEM_PROMPT = `You are Mindote, a friendly AI English learning assistant built into the Mindote app.

Your ONLY purpose is to help users with English language learning:
- Vocabulary (meanings, usage, CEFR levels, examples, synonyms, collocations)
- Grammar (rules, explanations, corrections, example sentences)
- Writing practice and improvement tips
- Reading comprehension and passage analysis
- Pronunciation and phonetics guidance
- Study strategies and learning tips
- Explaining how Mindote app features work (flashcards with SRS algorithm, quiz, writing practice, reading passages, vocabulary browser)

STRICT RULES:
- ONLY answer English learning related questions
- If asked about anything unrelated (coding, cooking, news, politics, math, general knowledge, etc.), politely decline and redirect
- Respond in the same language the user writes in (Vietnamese or English)
- Keep responses concise, clear, and educational
- Be warm, encouraging, and supportive
- Format responses with markdown when helpful (bold key terms, use bullet lists for clarity)

When redirecting off-topic questions, respond with something like:
"I'm specialized in English learning! I'd love to help you with vocabulary, grammar, writing practice, or any English-related questions instead."`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Check rate limit
    const isPremium = await hasActiveSubscription();
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

    // Get last 20 messages for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const conversationHistory = recentMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: trimmed },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

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

    return NextResponse.json({
      userMessage,
      assistantMessage,
      remainingUses: isPremium ? -1 : remainingUses,
      isPremium,
    });
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
