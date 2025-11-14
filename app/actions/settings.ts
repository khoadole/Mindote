"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { ensureUserExists } from "@/lib/ensure-user";

/**
 * Update user's login streak
 * Called when user logs in or visits the dashboard
 */
export async function updateUserStreakAction() {
  try {
    const userId = await getUserId();
    await ensureUserExists(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastLoginDate: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    if (!user) {
      return { error: "User not found", data: null };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastLogin = user.lastLoginDate
      ? new Date(
          user.lastLoginDate.getFullYear(),
          user.lastLoginDate.getMonth(),
          user.lastLoginDate.getDate()
        )
      : null;

    let newStreak = user.currentStreak || 0;
    let newLongestStreak = user.longestStreak || 0;

    if (!lastLogin) {
      // First login ever
      newStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Same day, no change
        newStreak = user.currentStreak || 1;
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newStreak = (user.currentStreak || 0) + 1;
      } else {
        // Missed a day or more, reset streak
        newStreak = 1;
      }
    }

    // Update longest streak if current is higher
    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginDate: now,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
      },
    });

    return {
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error updating user streak:", error);
    return { error: "Failed to update streak", data: null };
  }
}

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

    // Get user streak data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastLoginDate: true,
      },
    });

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
        // Streak data
        currentStreak: user?.currentStreak || 0,
        longestStreak: user?.longestStreak || 0,
        lastLoginDate: user?.lastLoginDate,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { error: "Failed to get user stats", data: null };
  }
}
