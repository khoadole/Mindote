import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all levels with topic and word counts
    const topics = await prisma.cEFRTopic.groupBy({
      by: ["level"],
      _count: { id: true },
    });

    const words = await prisma.cEFRWord.findMany({
      select: {
        topic: {
          select: { level: true },
        },
      },
    });

    // Count words by level
    const wordCountByLevel: Record<string, number> = {};
    words.forEach((w) => {
      const level = w.topic.level;
      wordCountByLevel[level] = (wordCountByLevel[level] || 0) + 1;
    });

    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => {
      const topicData = topics.find((t) => t.level === level);
      return {
        level,
        topicCount: topicData?._count.id || 0,
        wordCount: wordCountByLevel[level] || 0,
      };
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Error fetching CEFR levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch CEFR levels" },
      { status: 500 },
    );
  }
}
