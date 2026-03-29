import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import type { ReadingPracticeBlock } from "@/lib/reading-practice-types";
import { scoreReadingPracticeAttempt } from "@/lib/reading-practice-scoring";

interface SubmitReadingPracticeAttemptRequest {
  partId: string;
  answers: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SubmitReadingPracticeAttemptRequest = await request.json();
    const { partId, answers } = body;

    if (!partId || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "partId and answers are required" },
        { status: 400 }
      );
    }

    const part = await prisma.readingPracticePart.findFirst({
      where: {
        id: partId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        questionBlocks: true,
      },
    });

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const blocks = (part.questionBlocks as unknown as ReadingPracticeBlock[]) || [];
    const result = scoreReadingPracticeAttempt(blocks, answers);
    const answersJson = answers as Prisma.InputJsonValue;
    const resultJson = {
      breakdown: result.breakdown,
    } as unknown as Prisma.InputJsonValue;

    const latestAttempt = await prisma.readingPracticeAttempt.upsert({
      where: {
        userId_partId: {
          userId,
          partId,
        },
      },
      create: {
        userId,
        partId,
        answers: answersJson,
        result: resultJson,
        correctCount: result.correctCount,
        totalCount: result.totalCount,
        score: result.score,
        completedAt: new Date(),
      },
      update: {
        answers: answersJson,
        result: resultJson,
        correctCount: result.correctCount,
        totalCount: result.totalCount,
        score: result.score,
        completedAt: new Date(),
      },
    });

    await logActivity({
      userId,
      activityType: "reading_attempt",
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt: latestAttempt,
        correctCount: result.correctCount,
        totalCount: result.totalCount,
        score: result.score,
        breakdown: result.breakdown,
      },
    });
  } catch (error) {
    console.error("Submit reading practice attempt error:", error);
    return NextResponse.json(
      { error: "Failed to submit reading practice attempt" },
      { status: 500 }
    );
  }
}
