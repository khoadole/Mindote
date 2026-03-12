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

// GET: single passage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const passage = await prisma.writingPassage.findUnique({
      where: { id },
      include: { _count: { select: { attempts: true } } },
    });

    if (!passage) {
      return NextResponse.json(
        { error: "Passage not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: passage });
  } catch (error) {
    console.error("Admin get passage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch passage" },
      { status: 500 },
    );
  }
}

// PUT: update a passage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
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

    if (level) {
      const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
      if (!validLevels.includes(level)) {
        return NextResponse.json(
          { error: "Invalid level. Must be one of: A1, A2, B1, B2, C1, C2" },
          { status: 400 },
        );
      }
    }

    const passage = await prisma.writingPassage.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(titleEn !== undefined && { titleEn }),
        ...(sourceText !== undefined && { sourceText }),
        ...(referenceText !== undefined && { referenceText }),
        ...(level !== undefined && { level }),
        ...(topic !== undefined && { topic }),
        ...(tags !== undefined && { tags }),
        ...(targetWordCount !== undefined && { targetWordCount }),
        ...(estimatedMinutes !== undefined && { estimatedMinutes }),
        ...(isPublished !== undefined && { isPublished }),
        ...(order !== undefined && { order }),
        ...(grammarFocus !== undefined && { grammarFocus }),
      },
    });

    return NextResponse.json({ success: true, data: passage });
  } catch (error) {
    console.error("Admin update passage error:", error);
    return NextResponse.json(
      { error: "Failed to update passage" },
      { status: 500 },
    );
  }
}

// DELETE: remove a passage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.writingPassage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete passage error:", error);
    return NextResponse.json(
      { error: "Failed to delete passage" },
      { status: 500 },
    );
  }
}
