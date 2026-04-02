import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { validateAndNormalizeReadingBlocks } from "@/lib/reading-practice-types";

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const part = await prisma.readingPracticePart.findUnique({
      where: { id },
      include: {
        _count: { select: { attempts: true } },
      },
    });

    if (!part) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: part });
  } catch (error) {
    console.error("Admin get reading practice error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading practice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.examTitle !== undefined) data.examTitle = body.examTitle;
    if (body.examCode !== undefined) data.examCode = body.examCode || null;
    if (body.partNumber !== undefined) {
      const partNumber = Number(body.partNumber);
      if (![1, 2, 3].includes(partNumber)) {
        return NextResponse.json(
          { error: "partNumber must be 1, 2 or 3" },
          { status: 400 }
        );
      }
      data.partNumber = partNumber;
    }
    if (body.title !== undefined) data.title = body.title;
    if (body.passageSubtitle !== undefined) {
      data.passageSubtitle = body.passageSubtitle || null;
    }
    if (body.passageSubSubtitle !== undefined) {
      data.passageSubSubtitle = body.passageSubSubtitle || null;
    }
    if (body.content !== undefined) data.content = body.content;
    if (body.instructions !== undefined) data.instructions = body.instructions || null;
    if (body.estimatedMinutes !== undefined) {
      data.estimatedMinutes = Number(body.estimatedMinutes) || 20;
    }
    if (body.level !== undefined) data.level = body.level || null;
    if (body.tags !== undefined) {
      data.tags = Array.isArray(body.tags)
        ? body.tags.filter((v: unknown) => typeof v === "string")
        : [];
    }
    if (body.status !== undefined) {
      if (!["DRAFT", "PUBLISHED"].includes(body.status)) {
        return NextResponse.json(
          { error: "status must be DRAFT or PUBLISHED" },
          { status: 400 }
        );
      }
      data.status = body.status;
    }
    if (body.displayOrder !== undefined) {
      data.displayOrder = Number(body.displayOrder) || 0;
    }

    if (body.questionBlocks !== undefined) {
      const validated = validateAndNormalizeReadingBlocks(body.questionBlocks);
      if (!validated.isValid) {
        return NextResponse.json(
          { error: "Invalid questionBlocks", details: validated.errors },
          { status: 400 }
        );
      }
      data.questionBlocks = validated.normalizedBlocks as unknown as object;
      data.totalQuestions = validated.totalQuestions;
    }

    const updated = await prisma.readingPracticePart.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Admin update reading practice error:", error);
    return NextResponse.json(
      { error: "Failed to update reading practice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.readingPracticePart.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete reading practice error:", error);
    return NextResponse.json(
      { error: "Failed to delete reading practice" },
      { status: 500 }
    );
  }
}
