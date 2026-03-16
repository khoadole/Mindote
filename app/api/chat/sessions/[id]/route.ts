import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const session = await prisma.chatSession.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const body = await request.json();
    const { title } = body as { title: string };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findFirst({ where: { id, userId } });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await prisma.chatSession.update({
      where: { id },
      data: { title: title.trim().slice(0, 100) },
    });

    return NextResponse.json({ session: updated });
  } catch {
    return NextResponse.json({ error: "Failed to rename session" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const session = await prisma.chatSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.chatSession.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
