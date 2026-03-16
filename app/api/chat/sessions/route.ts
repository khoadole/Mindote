import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getUserId();

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    const body = await request.json();
    const { title } = body as { title: string };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: title.trim().slice(0, 100),
      },
    });

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
