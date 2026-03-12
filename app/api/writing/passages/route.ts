import { NextRequest, NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdOrNull();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get("level");
    const topic = searchParams.get("topic");
    const search = searchParams.get("search");

    const passages = await prisma.writingPassage.findMany({
      where: {
        isPublished: true,
        ...(level ? { level } : {}),
        ...(topic ? { topic } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { topic: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    // Get user's attempt metadata for each passage
    const passageIds = passages.map((p) => p.id);
    const attempts = await prisma.writingAttempt.findMany({
      where: {
        userId,
        passageId: { in: passageIds },
      },
      orderBy: { completedAt: "desc" },
      select: {
        passageId: true,
        score: true,
        completedAt: true,
      },
    });

    // Build a map: passageId → { count, lastScore }
    const attemptMap = new Map<
      string,
      { count: number; lastScore: number | null }
    >();
    for (const attempt of attempts) {
      const existing = attemptMap.get(attempt.passageId);
      if (!existing) {
        attemptMap.set(attempt.passageId, {
          count: 1,
          lastScore: attempt.score,
        });
      } else {
        existing.count++;
      }
    }

    const enriched = passages.map((p) => ({
      ...p,
      _attemptCount: attemptMap.get(p.id)?.count ?? 0,
      _lastScore: attemptMap.get(p.id)?.lastScore ?? null,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Fetch writing passages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch writing passages" },
      { status: 500 },
    );
  }
}
