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

// GET: list all passages (admin sees unpublished too)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const passages = await prisma.writingPassage.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { attempts: true } },
      },
    });

    return NextResponse.json({ success: true, data: passages });
  } catch (error) {
    console.error("Admin fetch passages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch passages" },
      { status: 500 },
    );
  }
}

// POST: create a new passage
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      titleEn,
      sourceText,
      referenceText,
      level,
      topic,
      tags,
      targetWordCount,
      estimatedMinutes,
      isPublished,
      order,
      grammarFocus,
    } = body;

    if (!title || !sourceText || !level || !topic) {
      return NextResponse.json(
        { error: "title, sourceText, level, and topic are required" },
        { status: 400 },
      );
    }

    const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: "Invalid level. Must be one of: A1, A2, B1, B2, C1, C2" },
        { status: 400 },
      );
    }

    const passage = await prisma.writingPassage.create({
      data: {
        title,
        titleEn: titleEn || null,
        sourceText,
        referenceText: referenceText || null,
        level,
        topic,
        tags: tags ?? [],
        targetWordCount: targetWordCount ?? 100,
        estimatedMinutes: estimatedMinutes ?? 10,
        isPublished: isPublished ?? true,
        order: order ?? 0,
        grammarFocus: grammarFocus || null,
      },
    });

    return NextResponse.json({ success: true, data: passage }, { status: 201 });
  } catch (error) {
    console.error("Admin create passage error:", error);
    return NextResponse.json(
      { error: "Failed to create passage" },
      { status: 500 },
    );
  }
}
