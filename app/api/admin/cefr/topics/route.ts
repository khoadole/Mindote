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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");

    const topics = await prisma.cEFRTopic.findMany({
      where: level ? { level } : undefined,
      include: { _count: { select: { words: true } } },
      orderBy: [{ level: "asc" }, { order: "asc" }],
    });

    return NextResponse.json({
      topics: topics.map((t) => ({
        id: t.id,
        level: t.level,
        order: t.order,
        name: t.name,
        isFree: t.isFree,
        wordCount: t._count.words,
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/cefr/topics]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { level, name } = body;

    if (!level || !name) {
      return NextResponse.json(
        { error: "level and name are required" },
        { status: 400 }
      );
    }

    const maxOrderTopic = await prisma.cEFRTopic.findFirst({
      where: { level },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (maxOrderTopic?.order ?? 0) + 1;

    const topic = await prisma.cEFRTopic.create({
      data: {
        level,
        name,
        order: nextOrder,
        isFree: false,
      },
      select: {
        id: true,
        level: true,
        order: true,
        name: true,
        isFree: true,
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/cefr/topics]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
