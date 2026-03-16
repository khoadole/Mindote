import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ level: string }> },
) {
  try {
    const { level } = await params;
    const levelUpper = level.toUpperCase();

    // Validate level
    if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(levelUpper)) {
      return NextResponse.json(
        { error: "Invalid CEFR level" },
        { status: 400 },
      );
    }

    // Get all topics for this level with word counts
    const topics = await prisma.cEFRTopic.findMany({
      where: { level: levelUpper },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { words: true },
        },
      },
    });

    const formattedTopics = topics.map((topic) => ({
      id: topic.id,
      order: topic.order,
      name: topic.name,
      isFree: topic.isFree,
      wordCount: topic._count.words,
    }));

    return NextResponse.json({
      level: levelUpper,
      topics: formattedTopics,
    });
  } catch (error) {
    console.error("Error fetching CEFR topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch CEFR topics" },
      { status: 500 },
    );
  }
}
