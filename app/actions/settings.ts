"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { ensureUserExists } from "@/lib/ensure-user";

/**
 * Get user settings
 */
export async function getSettingsAction() {
  try {
    const userId = await getUserId();

    // Ensure user exists in database
    await ensureUserExists(userId);

    let settings = await prisma.setting.findUnique({
      where: { userId },
    });

    // Auto-create settings if not exists
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          userId,
        },
      });
    }

    return {
      data: {
        theme: settings.theme,
        language: settings.language,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting settings:", error);
    return { error: "Failed to get settings", data: null };
  }
}

/**
 * Update user settings
 */
export async function updateSettingsAction(data: {
  theme?: string;
  language?: string;
}) {
  try {
    const userId = await getUserId();

    // Ensure user exists in database
    await ensureUserExists(userId);

    const settings = await prisma.setting.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });

    revalidatePath("/settings");

    return {
      data: {
        theme: settings.theme,
        language: settings.language,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { error: "Failed to update settings", data: null };
  }
}

/**
 * Get user stats (total words, collections, etc.)
 * ✅ Optimized with single aggregation query
 */
export async function getUserStatsAction() {
  const startTime = Date.now();
  try {
    const userId = await getUserId();
    console.log(`[getUserStats] getUserId took ${Date.now() - startTime}ms`);

    const queryStart = Date.now();
    
    // ✅ Optimization: Use raw SQL for better performance
    const [statsResult, totalCollections] = await Promise.all([
      // Single aggregation for all word stats
      prisma.$queryRaw<Array<{
        total_words: bigint;
        mastered_words: bigint;
        avg_score: number | null;
      }>>`
        SELECT 
          COUNT(*)::bigint as total_words,
          COUNT(CASE WHEN score >= 80 THEN 1 END)::bigint as mastered_words,
          AVG(score) as avg_score
        FROM words w
        INNER JOIN collections c ON w.collection_id = c.id
        WHERE c.user_id = ${userId}::uuid
      `,
      // Collections count (simple query)
      prisma.collection.count({
        where: { userId },
      }),
    ]);
    
    console.log(`[getUserStats] DB queries took ${Date.now() - queryStart}ms`);
    console.log(`[getUserStats] Total took ${Date.now() - startTime}ms`);

    const stats = statsResult[0];
    
    return {
      data: {
        totalWords: Number(stats?.total_words || 0),
        totalCollections,
        masteredWords: Number(stats?.mastered_words || 0),
        avgScore: Number(stats?.avg_score || 0),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { error: "Failed to get user stats", data: null };
  }
}
