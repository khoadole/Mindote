import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { validateAndNormalizeReadingBlocks } from "@/lib/reading-practice-types";

const readingPracticePart = (prisma as any).readingPracticePart;

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

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parts = await readingPracticePart.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { attempts: true } },
      },
    });

    return NextResponse.json({ success: true, data: parts });
  } catch (error) {
    console.error("Admin list reading practice error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading practice" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      examTitle,
      examCode,
      partNumber,
      title,
      content,
      instructions,
      questionBlocks,
      estimatedMinutes,
      level,
      tags,
      status,
      displayOrder,
    } = body;

    if (!examTitle || !title || !content || !partNumber || !questionBlocks) {
      return NextResponse.json(
        {
          error:
            "examTitle, partNumber, title, content and questionBlocks are required",
        },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(Number(partNumber))) {
      return NextResponse.json(
        { error: "partNumber must be 1, 2 or 3" },
        { status: 400 }
      );
    }

    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be DRAFT or PUBLISHED" },
        { status: 400 }
      );
    }

    const validated = validateAndNormalizeReadingBlocks(questionBlocks);
    if (!validated.isValid) {
      return NextResponse.json(
        { error: "Invalid questionBlocks", details: validated.errors },
        { status: 400 }
      );
    }

    const part = await readingPracticePart.create({
      data: {
        examTitle,
        examCode: examCode || null,
        partNumber: Number(partNumber),
        title,
        content,
        instructions: instructions || null,
        questionBlocks: validated.normalizedBlocks as unknown as object,
        totalQuestions: validated.totalQuestions,
        estimatedMinutes: Number(estimatedMinutes) || 20,
        level: level || null,
        tags: Array.isArray(tags) ? tags.filter((v) => typeof v === "string") : [],
        status: status || "DRAFT",
        displayOrder: Number(displayOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, data: part }, { status: 201 });
  } catch (error) {
    console.error("Admin create reading practice error:", error);
    return NextResponse.json(
      { error: "Failed to create reading practice" },
      { status: 500 }
    );
  }
}
