import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import { checkAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        createdAt: true,
        lastLoginDate: true,
        currentStreak: true,
        _count: {
          select: {
            collections: true,
            writingAttempts: true,
            cefrProgress: true,
          },
        },
        subscriptions: {
          where: { status: "active" },
          select: { name: true, status: true, provider: true, endsAt: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        aiUsages: {
          where: { date: today },
          select: { count: true },
        },
      },
    });

    // Get word counts per user (aggregate via collections)
    const wordCounts = await prisma.word.groupBy({
      by: ["collectionId"],
      _count: { id: true },
    });

    const collectionToWordCount = new Map(
      wordCounts.map((w) => [w.collectionId, w._count.id]),
    );

    // Get collection → user mapping
    const collections = await prisma.collection.findMany({
      select: { id: true, userId: true },
    });

    const userWordCount = new Map<string, number>();
    for (const col of collections) {
      const count = collectionToWordCount.get(col.id) ?? 0;
      userWordCount.set(col.userId, (userWordCount.get(col.userId) ?? 0) + count);
    }

    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      username: u.username,
      createdAt: u.createdAt,
      lastLoginDate: u.lastLoginDate,
      currentStreak: u.currentStreak,
      collectionsCount: u._count.collections,
      wordsCount: userWordCount.get(u.id) ?? 0,
      writingAttemptsCount: u._count.writingAttempts,
      cefrLearnedCount: u._count.cefrProgress,
      activeSubscription: u.subscriptions[0] ?? null,
      aiUsagesToday: u.aiUsages[0]?.count ?? 0,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
