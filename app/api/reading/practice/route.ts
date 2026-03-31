import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

type ReadingSort = "part_asc" | "part_desc" | "updated_desc" | "updated_asc";

const SORT_OPTIONS: Record<ReadingSort, Array<Record<string, "asc" | "desc">>> = {
  part_asc: [
    { partNumber: "asc" },
    { displayOrder: "asc" },
    { examTitle: "asc" },
    { createdAt: "desc" },
  ],
  part_desc: [
    { partNumber: "desc" },
    { displayOrder: "asc" },
    { examTitle: "asc" },
    { createdAt: "desc" },
  ],
  updated_desc: [
    { updatedAt: "desc" },
    { partNumber: "asc" },
    { displayOrder: "asc" },
  ],
  updated_asc: [
    { updatedAt: "asc" },
    { partNumber: "asc" },
    { displayOrder: "asc" },
  ],
};

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawSearch = searchParams.get("search")?.trim() || "";
    const rawSort = (searchParams.get("sort") || "part_asc") as ReadingSort;
    const rawPart = searchParams.get("part");

    const sort = SORT_OPTIONS[rawSort] ? rawSort : "part_asc";

    let parsedPart: 1 | 2 | 3 | null = null;
    if (rawPart) {
      const candidate = Number(rawPart);
      if ([1, 2, 3].includes(candidate)) {
        parsedPart = candidate as 1 | 2 | 3;
      }
    }

    const parts = await prisma.readingPracticePart.findMany({
      where: {
        status: "PUBLISHED",
        ...(parsedPart ? { partNumber: parsedPart } : {}),
        ...(rawSearch
          ? {
              OR: [
                { examTitle: { contains: rawSearch, mode: "insensitive" } },
                { title: { contains: rawSearch, mode: "insensitive" } },
                { examCode: { contains: rawSearch, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: SORT_OPTIONS[sort],
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
