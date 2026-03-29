import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parts = await prisma.readingPracticePart.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { displayOrder: "asc" },
        { examTitle: "asc" },
        { partNumber: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        examTitle: true,
        examCode: true,
        partNumber: true,
        title: true,
        totalQuestions: true,
        estimatedMinutes: true,
        level: true,
        tags: true,
        updatedAt: true,
      },
    });

    const attempts = await prisma.readingPracticeAttempt.findMany({
      where: {
        userId,
        partId: { in: parts.map((p) => p.id) },
      },
      select: {
        partId: true,
        score: true,
        correctCount: true,
        totalCount: true,
        completedAt: true,
      },
    });

    const attemptMap = new Map(attempts.map((attempt) => [attempt.partId, attempt]));

    const enriched = parts.map((part) => ({
      ...part,
      latestAttempt: attemptMap.get(part.id) || null,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Fetch reading practice list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading practice" },
      { status: 500 }
    );
  }
}
