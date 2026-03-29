"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { calculateNextReview, type ReviewQuality } from "@/lib/srs";
import { logActivity } from "@/lib/activity-logger";

// Re-export ReviewQuality for client components
export type { ReviewQuality };

/**
 * Get all words due for review
 * ✅ OPTIMIZED: Fixed N+1 query by removing nested collection select
 * Collection data loaded separately for unique collections only
 */
export async function getDueWords(options?: {
  limit?: number;
  offset?: number;
}) {
  try {
    const userId = await getUserId();
    const { limit = 100, offset = 0 } = options || {};

    // Get due words without collection data (single query)
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
      select: {
        id: true,
        term: true,
        definition: true,
        example: true,
        phonetic: true,
        partOfSpeech: true,
        score: true,
        easeFactor: true,
        interval: true,
        repetitions: true,
        lastReviewed: true,
        nextReview: true,
        collectionId: true,
      },
      orderBy: {
        nextReview: "asc",
      },
      take: limit,
      skip: offset,
    });

    // Get unique collection IDs
    const collectionIds = [...new Set(words.map((w) => w.collectionId))];

    // Batch load collections (single query for all unique collections)
    const collections = await prisma.collection.findMany({
      where: {
        id: { in: collectionIds },
        userId, // Security: verify ownership
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    // Create collection map for O(1) lookup
    const collectionMap = new Map(
      collections.map((c) => [c.id, { id: c.id, name: c.name, color: c.color }])
    );

    // Attach collection data to words
    const wordsWithCollection = words.map((word) => ({
      ...word,
      collection: collectionMap.get(word.collectionId) || {
        id: word.collectionId,
        name: "Unknown",
        color: "#gray",
      },
    }));

    return { success: true, words: wordsWithCollection };
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

    // Log learning activity for streak tracking
    await logActivity({
      userId,
      activityType: "review",
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
 * Log quiz completion as learning activity for streak tracking.
 */
export async function logQuizActivityAction() {
  try {
    const userId = await getUserId();

    await logActivity({
      userId,
      activityType: "review",
    });

    revalidatePath("/dashboard");
    revalidatePath("/quiz");

    return { success: true };
  } catch (error) {
    console.error("Error logging quiz activity:", error);
    return { success: false, error: "Failed to log quiz activity" };
  }
}

/**
 * Get due words by collection
 * ✅ OPTIMIZED: Fixed N+1 query, added pagination
 */
export async function getDueWordsByCollection(
  collectionId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  try {
    const userId = await getUserId();
    const { limit = 100, offset = 0 } = options || {};

    // Get collection data first (verify ownership)
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        userId,
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    if (!collection) {
      return { success: false, error: "Collection not found" };
    }

    // Get due words (single query)
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
      select: {
        id: true,
        term: true,
        definition: true,
        example: true,
        phonetic: true,
        partOfSpeech: true,
        score: true,
        easeFactor: true,
        interval: true,
        repetitions: true,
        lastReviewed: true,
        nextReview: true,
        collectionId: true,
      },
      orderBy: {
        nextReview: "asc",
      },
      take: limit,
      skip: offset,
    });

    // Attach collection data to all words
    const wordsWithCollection = words.map((word) => ({
      ...word,
      collection,
    }));

    return { success: true, words: wordsWithCollection };
  } catch (error) {
    console.error("Error fetching due words by collection:", error);
    return { success: false, error: "Failed to fetch due words" };
  }
}
