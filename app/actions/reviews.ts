"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { calculateNextReview, type ReviewQuality } from "@/lib/srs";

// Re-export ReviewQuality for client components
export type { ReviewQuality };

/**
 * Get all words due for review
 */
export async function getDueWords() {
  try {
    const userId = await getUserId();

    const words = await prisma.word.findMany({
      where: {
        collection: {
          userId,
        },
        OR: [
          { nextReview: null }, // New words
          { nextReview: { lte: new Date() } }, // Due words
        ],
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        nextReview: "asc",
      },
    });

    return { success: true, words };
  } catch (error) {
    console.error("Error fetching due words:", error);
    return { success: false, error: "Failed to fetch due words" };
  }
}

/**
 * Get count of words due today
 */
export async function getDueCount() {
  try {
    const userId = await getUserId();

    const count = await prisma.word.count({
      where: {
        collection: {
          userId,
        },
        OR: [
          { nextReview: null }, // New words
          { nextReview: { lte: new Date() } }, // Due words
        ],
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error fetching due count:", error);
    return { success: false, count: 0 };
  }
}

/**
 * Submit review for a word
 * @param wordId - Word ID
 * @param quality - Review quality (0=Again, 3=Good, 5=Easy)
 */
export async function submitReview(wordId: string, quality: ReviewQuality) {
  try {
    const userId = await getUserId();

    // Get current word data
    const word = await prisma.word.findFirst({
      where: {
        id: wordId,
        collection: {
          userId,
        },
      },
    });

    if (!word) {
      return { success: false, error: "Word not found" };
    }

    // Calculate new SRS data
    const srsData = calculateNextReview(quality, {
      easeFactor: word.easeFactor,
      interval: word.interval,
      repetitions: word.repetitions,
      lastReviewed: word.lastReviewed || undefined,
      nextReview: word.nextReview || undefined,
    });

    // Update word
    await prisma.word.update({
      where: { id: wordId },
      data: {
        easeFactor: srsData.easeFactor,
        interval: srsData.interval,
        repetitions: srsData.repetitions,
        lastReviewed: srsData.lastReviewed,
        nextReview: srsData.nextReview,
        score: quality === 0 ? Math.max(0, word.score - 1) : word.score + 1,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/flashcards");

    return { success: true, nextReview: srsData.nextReview };
  } catch (error) {
    console.error("Error submitting review:", error);
    return { success: false, error: "Failed to submit review" };
  }
}

/**
 * Get due words by collection
 */
export async function getDueWordsByCollection(collectionId: string) {
  try {
    const userId = await getUserId();

    const words = await prisma.word.findMany({
      where: {
        collectionId,
        collection: {
          userId,
        },
        OR: [
          { nextReview: null }, // New words
          { nextReview: { lte: new Date() } }, // Due words
        ],
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        nextReview: "asc",
      },
    });

    return { success: true, words };
  } catch (error) {
    console.error("Error fetching due words by collection:", error);
    return { success: false, error: "Failed to fetch due words" };
  }
}
