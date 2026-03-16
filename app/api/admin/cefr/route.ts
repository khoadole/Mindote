import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

async function checkAdmin(userId: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (adminEmails.length === 0) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return !!user && adminEmails.includes(user.email);
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const levels = await Promise.all(
      LEVELS.map(async (level) => {
        const topics = await prisma.cEFRTopic.findMany({
          where: { level },
          include: { _count: { select: { words: true } } },
        });

        const topicCount = topics.length;
        const wordCount = topics.reduce((sum, t) => sum + t._count.words, 0);
        const freeTopicCount = topics.filter((t) => t.isFree).length;

        return { level, topicCount, wordCount, freeTopicCount };
      })
    );

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("[GET /api/admin/cefr]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
