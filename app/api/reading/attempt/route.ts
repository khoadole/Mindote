import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

interface SubmitAttemptRequest {
  passageId: string;
  answers: Record<number, string>; // { 0: "A", 1: "B", ... }
  timeSpent: number; // seconds
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SubmitAttemptRequest = await request.json();
    const { passageId, answers, timeSpent } = body;

    if (!passageId || !answers || timeSpent === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get passage with questions
    const passage = await prisma.readingPassage.findUnique({
      where: { id: passageId },
    });

    if (!passage) {
      return NextResponse.json({ error: "Passage not found" }, { status: 404 });
    }

    // Calculate score
    const questions = passage.questions as Array<{
      correctAnswer: string;
    }>;

    let correctCount = 0;
    Object.entries(answers).forEach(([indexStr, answer]) => {
      const index = parseInt(indexStr);
      if (questions[index]?.correctAnswer === answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    // Save attempt
    const attempt = await prisma.readingAttempt.create({
      data: {
        userId,
        passageId,
        timeSpent,
        score,
        answers,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...attempt,
        correctCount,
        totalQuestions: questions.length,
      },
    });
  } catch (error: any) {
    console.error("Submit attempt error:", error);
    return NextResponse.json(
      { error: "Failed to submit attempt" },
      { status: 500 }
    );
  }
}

// GET: Fetch user's attempts for a passage
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const passageId = searchParams.get("passageId");

    if (!passageId) {
      return NextResponse.json(
        { error: "Passage ID is required" },
        { status: 400 }
      );
    }

    const attempts = await prisma.readingAttempt.findMany({
      where: {
        userId,
        passageId,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: attempts,
    });
  } catch (error: any) {
    console.error("Fetch attempts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}
