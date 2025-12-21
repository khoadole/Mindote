"use server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { revalidatePath } from "next/cache";

/**
 * Save YouTube video to history
 */
export async function saveYouTubeHistoryAction(data: {
  url: string;
  title: string;
  videoId: string;
}) {
  try {
    const userId = await getUserId();

    // Upsert: Update if exists, create if not
    const history = await prisma.youTubeHistory.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId: data.videoId,
        },
      },
      update: {
        title: data.title,
        url: data.url,
      },
      create: {
        userId,
        url: data.url,
        title: data.title,
        videoId: data.videoId,
      },
    });

    revalidatePath("/youtube");
    return { success: true, data: history };
  } catch (error) {
    console.error("Error saving YouTube history:", error);
    return { success: false, error: "Failed to save history" };
  }
}

/**
 * Get user's YouTube history
 */
export async function getYouTubeHistoryAction() {
  try {
    const userId = await getUserId();

    const history = await prisma.youTubeHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit to last 20 videos
    });

    return { success: true, data: history };
  } catch (error) {
    console.error("Error fetching YouTube history:", error);
    return { success: false, error: "Failed to fetch history" };
  }
}

/**
 * Delete YouTube history item
 */
export async function deleteYouTubeHistoryAction(id: string) {
  try {
    const userId = await getUserId();

    // Verify ownership before deleting
    const history = await prisma.youTubeHistory.findUnique({
      where: { id },
    });

    if (!history || history.userId !== userId) {
      return { success: false, error: "History item not found" };
    }

    await prisma.youTubeHistory.delete({
      where: { id },
    });

    revalidatePath("/youtube");
    return { success: true };
  } catch (error) {
    console.error("Error deleting YouTube history:", error);
    return { success: false, error: "Failed to delete history" };
  }
}

/**
 * Clear all YouTube history
 */
export async function clearYouTubeHistoryAction() {
  try {
    const userId = await getUserId();

    await prisma.youTubeHistory.deleteMany({
      where: { userId },
    });

    revalidatePath("/youtube");
    return { success: true };
  } catch (error) {
    console.error("Error clearing YouTube history:", error);
    return { success: false, error: "Failed to clear history" };
  }
}
