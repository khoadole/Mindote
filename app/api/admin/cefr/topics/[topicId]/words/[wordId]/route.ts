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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string; wordId: string }> }
) {
  try {
    const userId = await getUserId();
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { topicId, wordId } = await params;
    const body = await request.json();
    const { term, pos, phonetic, definition, example, order } = body;

    const updateData: {
      term?: string;
      pos?: string | null;
      phonetic?: string | null;
      definition?: string;
      example?: string | null;
      order?: number;
    } = {};
    if (term !== undefined) updateData.term = term;
    if (pos !== undefined) updateData.pos = pos;
    if (phonetic !== undefined) updateData.phonetic = phonetic;
    if (definition !== undefined) updateData.definition = definition;
    if (example !== undefined) updateData.example = example;
    if (order !== undefined) updateData.order = order;

    const word = await prisma.cEFRWord.update({
      where: { id: wordId, topicId },
      data: updateData,
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

    return NextResponse.json(word);
  } catch (error) {
    console.error(
      "[PATCH /api/admin/cefr/topics/[topicId]/words/[wordId]]",
      error
    );
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string; wordId: string }> }
) {
  try {
    const userId = await getUserId();
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { topicId, wordId } = await params;

    await prisma.cEFRWord.delete({
      where: { id: wordId, topicId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "[DELETE /api/admin/cefr/topics/[topicId]/words/[wordId]]",
      error
    );
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
