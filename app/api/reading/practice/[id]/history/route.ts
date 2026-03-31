import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

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

    const attempts = await prisma.readingPracticeAttempt.findMany({
      where: {
        userId,
        partId: id,
      },
      select: {
        id: true,
        score: true,
        correctCount: true,
        totalCount: true,
        result: true,
        completedAt: true,
        updatedAt: true,
      },
      orderBy: {
        completedAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    console.error("Fetch reading practice history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading practice history" },
      { status: 500 }
    );
  }
}
