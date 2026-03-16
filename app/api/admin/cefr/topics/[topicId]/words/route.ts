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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const userId = await getUserId();
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { topicId } = await params;

    const words = await prisma.cEFRWord.findMany({
      where: { topicId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        order: true,
        term: true,
        pos: true,
        phonetic: true,
        definition: true,
        example: true,
      },
    });

    return NextResponse.json({ words });
  } catch (error) {
    console.error("[GET /api/admin/cefr/topics/[topicId]/words]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const userId = await getUserId();
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { topicId } = await params;
    const body = await request.json();
    const { term, pos, phonetic, definition, example } = body;

    if (!term || !definition) {
      return NextResponse.json(
        { error: "term and definition are required" },
        { status: 400 }
      );
    }

    const maxOrderWord = await prisma.cEFRWord.findFirst({
      where: { topicId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (maxOrderWord?.order ?? 0) + 1;

    const word = await prisma.cEFRWord.create({
      data: {
        topicId,
        term,
        pos: pos ?? null,
        phonetic: phonetic ?? null,
        definition,
        example: example ?? null,
        order: nextOrder,
      },
      select: {
        id: true,
        order: true,
        term: true,
        pos: true,
        phonetic: true,
        definition: true,
        example: true,
      },
    });

    return NextResponse.json(word, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/cefr/topics/[topicId]/words]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
