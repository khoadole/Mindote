import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const passageId = request.nextUrl.searchParams.get("passageId");

    if (!passageId) {
      return NextResponse.json(
        { error: "passageId is required" },
        { status: 400 },
      );
    }

    const attempts = await prisma.writingAttempt.findMany({
      where: { userId, passageId },
      orderBy: { completedAt: "desc" },
      take: 3,
    });

    return NextResponse.json({ success: true, data: attempts });
  } catch (error) {
    console.error("Fetch writing attempts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 },
    );
  }
}
