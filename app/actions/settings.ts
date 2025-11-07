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
 * ✅ ULTRA-OPTIMIZED: Single query with CTE - no multiple JOINs
 */
export async function getUserStatsAction() {
  const startTime = Date.now();
  try {
    const userId = await getUserId();
    console.log(`[getUserStats] getUserId took ${Date.now() - startTime}ms`);

    const queryStart = Date.now();

    // ✅ OPTIMIZATION: Single raw SQL query with CTE (Common Table Expression)
    // This avoids multiple JOIN operations and executes in one pass
    const result = await prisma.$queryRaw<
      Array<{
        total_collections: bigint;
        total_words: bigint;
        mastered_words: bigint;
        avg_score: number | null;
        new_words: bigint;
        learning_words: bigint;
        familiar_words: bigint;
        master_words: bigint;
      }>
    >`
      WITH user_collections AS (
        SELECT id FROM collections WHERE user_id = ${userId}::uuid
      )
      SELECT 
        (SELECT COUNT(*)::bigint FROM user_collections) as total_collections,
        (SELECT COUNT(*)::bigint FROM words w WHERE w.collection_id IN (SELECT id FROM user_collections)) as total_words,
        (SELECT COUNT(*)::bigint FROM words w WHERE w.collection_id IN (SELECT id FROM user_collections) AND w.score >= 80) as mastered_words,
        (SELECT AVG(score) FROM words w WHERE w.collection_id IN (SELECT id FROM user_collections)) as avg_score,
        (SELECT COUNT(*)::bigint FROM words w WHERE w.collection_id IN (SELECT id FROM user_collections) AND w.repetitions = 0) as new_words,
        (SELECT COUNT(*)::bigint FROM words w WHERE w.collection_id IN (SELECT id FROM user_collections) AND w.repetitions >= 1 AND w.repetitions <= 3) as learning_words,
        (SELECT COUNT(*)::bigint FROM words w WHERE w.collection_id IN (SELECT id FROM user_collections) AND w.repetitions >= 4 AND w.repetitions <= 7) as familiar_words,
        (SELECT COUNT(*)::bigint FROM words w WHERE w.collection_id IN (SELECT id FROM user_collections) AND w.repetitions >= 8) as master_words
    `;

    console.log(`[getUserStats] DB query took ${Date.now() - queryStart}ms`);
    console.log(`[getUserStats] Total took ${Date.now() - startTime}ms`);

    const stats = result[0] || {
      total_collections: BigInt(0),
      total_words: BigInt(0),
      mastered_words: BigInt(0),
      avg_score: null,
      new_words: BigInt(0),
      learning_words: BigInt(0),
      familiar_words: BigInt(0),
      master_words: BigInt(0),
    };

    return {
      data: {
        totalWords: Number(stats.total_words),
        totalCollections: Number(stats.total_collections),
        masteredWords: Number(stats.mastered_words),
        avgScore: Math.round(Number(stats.avg_score) || 0),
        // Word stages based on repetitions (SRS progress)
        newWords: Number(stats.new_words),
        learningWords: Number(stats.learning_words),
        familiarWords: Number(stats.familiar_words),
        masterWords: Number(stats.master_words),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { error: "Failed to get user stats", data: null };
  }
}
