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
 */
export async function getUserStatsAction() {
  const startTime = Date.now();
  try {
    const userId = await getUserId();
    console.log(`[getUserStats] getUserId took ${Date.now() - startTime}ms`);

    const queryStart = Date.now();
    // Parallel queries for better performance
    const [totalWords, totalCollections, masteredWords, avgScoreResult] =
      await Promise.all([
        // Total words
        prisma.word.count({
          where: {
            collection: {
              userId,
            },
          },
        }),
        // Total collections
        prisma.collection.count({
          where: { userId },
        }),
        // Mastered words (score >= 80)
        prisma.word.count({
          where: {
            collection: {
              userId,
            },
            score: {
              gte: 80,
            },
          },
        }),
        // Average score
        prisma.word.aggregate({
          where: {
            collection: {
              userId,
            },
          },
          _avg: { score: true },
        }),
      ]);
    console.log(`[getUserStats] DB queries took ${Date.now() - queryStart}ms`);
    console.log(`[getUserStats] Total took ${Date.now() - startTime}ms`);

    const avgScore = avgScoreResult._avg.score || 0;

    return {
      data: {
        totalWords,
        totalCollections,
        masteredWords,
        avgScore,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { error: "Failed to get user stats", data: null };
  }
}
