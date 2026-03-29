import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import {
  stripAnswerKeysFromBlocks,
  type ReadingPracticeBlock,
} from "@/lib/reading-practice-types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const part = await prisma.readingPracticePart.findFirst({
      where: {
        id,
        status: "PUBLISHED",
      },
    });

    if (!part) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const latestAttempt = await prisma.readingPracticeAttempt.findUnique({
      where: {
        userId_partId: {
          userId,
          partId: id,
        },
      },
      select: {
        score: true,
        correctCount: true,
        totalCount: true,
        answers: true,
        result: true,
        completedAt: true,
      },
    });

    const safeBlocks = stripAnswerKeysFromBlocks(
      (part.questionBlocks as unknown as ReadingPracticeBlock[]) || []
    );

    return NextResponse.json({
      success: true,
      data: {
        ...part,
        questionBlocks: safeBlocks,
        latestAttempt,
      },
    });
  } catch (error) {
    console.error("Fetch reading practice detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading practice detail" },
      { status: 500 }
    );
  }
}
