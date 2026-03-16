import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ level: string; topicId: string }> },
) {
  try {
    const { level, topicId } = await params;
    const levelUpper = level.toUpperCase();

    // Validate level
    if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(levelUpper)) {
      return NextResponse.json(
        { error: "Invalid CEFR level" },
        { status: 400 },
      );
    }

    // Get topic with all words
    const topic = await prisma.cEFRTopic.findFirst({
      where: {
        id: topicId,
        level: levelUpper,
      },
      include: {
        words: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({
      level: levelUpper,
      topic: {
        id: topic.id,
        order: topic.order,
        name: topic.name,
        isFree: topic.isFree,
      },
      words: topic.words.map((word) => ({
        id: word.id,
        order: word.order,
        term: word.term,
        pos: word.pos,
        phonetic: word.phonetic,
        definition: word.definition,
        example: word.example,
      })),
    });
  } catch (error) {
    console.error("Error fetching CEFR words:", error);
    return NextResponse.json(
      { error: "Failed to fetch CEFR words" },
      { status: 500 },
    );
  }
}
