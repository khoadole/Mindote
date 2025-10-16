"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Get current user ID from session and ensure user exists in database
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;

  // Ensure user exists in database
  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: session.user.email!,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email: session.user.email!,
        username: session.user.user_metadata?.username || null,
        displayName:
          session.user.user_metadata?.display_name ||
          session.user.email?.split("@")[0] ||
          null,
        avatarUrl: session.user.user_metadata?.avatar_url || null,
      },
    });
  } catch (error) {
    console.error("Error upserting user:", error);
  }

  return userId;
}

/**
 * Get user settings
 */
export async function getSettingsAction() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

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
        srsEnabled: settings.srsEnabled,
        ttsEnabled: settings.ttsEnabled,
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
  srsEnabled?: boolean;
  ttsEnabled?: boolean;
  theme?: string;
  language?: string;
}) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

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
        srsEnabled: settings.srsEnabled,
        ttsEnabled: settings.ttsEnabled,
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
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

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
