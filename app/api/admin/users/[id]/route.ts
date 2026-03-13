import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import { checkAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await getUserId();
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetId } = params;

    // Core user profile
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginDate: true,
        currentStreak: true,
        longestStreak: true,
        setting: { select: { language: true, theme: true, learningLanguage: true } },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            name: true,
            status: true,
            statusFormatted: true,
            provider: true,
            price: true,
            startsAt: true,
            endsAt: true,
            renewsAt: true,
            createdAt: true,
            plan: { select: { name: true, interval: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Collections + word counts
    const collections = await prisma.collection.findMany({
      where: { userId: targetId },
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        _count: { select: { words: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalWords = collections.reduce((sum, c) => sum + c._count.words, 0);

    // Writing attempts (last 10)
    const writingAttempts = await prisma.writingAttempt.findMany({
      where: { userId: targetId },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        id: true,
        score: true,
        completedAt: true,
        userText: true,
        passage: { select: { title: true, level: true } },
      },
    });

    const writingStats = {
      total: await prisma.writingAttempt.count({ where: { userId: targetId } }),
      avgScore:
        writingAttempts.length > 0
          ? writingAttempts
              .filter((a) => a.score !== null)
              .reduce((sum, a) => sum + (a.score ?? 0), 0) /
            writingAttempts.filter((a) => a.score !== null).length
          : null,
      recent: writingAttempts,
    };

    // CEFR progress
    const cefrLearnedCount = await prisma.cEFRWordProgress.count({
      where: { userId: targetId },
    });

    // AI usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aiUsageToday = await prisma.aIUsage.findUnique({
      where: { userId_date: { userId: targetId, date: today } },
      select: { count: true },
    });

    const aiLogs = await prisma.aILog.findMany({
      where: { userId: targetId },
      select: { feature: true, totalTokens: true, cost: true },
    });

    const aiStats = {
      usagesToday: aiUsageToday?.count ?? 0,
      totalCost: aiLogs.reduce((sum, l) => sum + l.cost, 0),
      totalTokens: aiLogs.reduce((sum, l) => sum + l.totalTokens, 0),
      byFeature: aiLogs,
    };

    return NextResponse.json({
      success: true,
      data: {
        user,
        collections: { list: collections, totalWords },
        writingStats,
        cefrLearnedCount,
        aiStats,
      },
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
