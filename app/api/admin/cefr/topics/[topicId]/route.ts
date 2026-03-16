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
    const { name, isFree, order } = body;

    const updateData: { name?: string; isFree?: boolean; order?: number } = {};
    if (name !== undefined) updateData.name = name;
    if (isFree !== undefined) updateData.isFree = isFree;
    if (order !== undefined) updateData.order = order;

    const topic = await prisma.cEFRTopic.update({
      where: { id: topicId },
      data: updateData,
      select: {
        id: true,
        level: true,
        order: true,
        name: true,
        isFree: true,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[PATCH /api/admin/cefr/topics/[topicId]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.cEFRTopic.delete({
      where: { id: topicId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/cefr/topics/[topicId]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
