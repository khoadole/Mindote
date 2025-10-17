"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

/**
 * Get user settings
 */
export async function getSettingsAction() {
  try {
    const userId = await getUserId();

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
 * Get user statistics
 */
export async function getUserStatsAction() {
  try {
    const userId = await getUserId();

    const [totalWords, totalCollections, masteredWords, avgScoreResult] =
      await Promise.all([
        prisma.word.count({
          where: {
            collection: {
              userId,
            },
          },
        }),
        prisma.collection.count({
          where: { userId },
        }),
        prisma.word.count({
          where: {
            collection: {
              userId,
            },
            score: {
              gte: 4,
            },
          },
        }),
        prisma.word.aggregate({
          where: {
            collection: {
              userId,
            },
          },
          _avg: {
            score: true,
          },
        }),
      ]);

    return {
      data: {
        totalWords,
        totalCollections,
        masteredWords,
        avgScore: Math.round(avgScoreResult._avg.score || 0),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { error: "Failed to get statistics", data: null };
  }
}
