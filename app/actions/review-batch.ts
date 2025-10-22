"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import type { ReviewResult } from "@/lib/srs";

/**
 * Submit multiple reviews at once (batch update for better performance)
 * @param reviews - Array of review results
 */
export async function submitBatchReviews(reviews: ReviewResult[]) {
  try {
    const userId = await getUserId();

    if (reviews.length === 0) {
      return { success: true };
    }

    // Verify all words belong to user
    const wordIds = reviews.map((r) => r.wordId);
    const words = await prisma.word.findMany({
      where: {
        id: { in: wordIds },
        collection: {
          userId,
        },
      },
      select: {
        id: true,
        score: true,
      },
    });

    if (words.length !== wordIds.length) {
      return { success: false, error: "Some words not found" };
    }

    // Create a map for quick lookup
    const wordMap = new Map(words.map((w) => [w.id, w]));

    // Batch update all words
    await prisma.$transaction(
      reviews.map((review) => {
        const word = wordMap.get(review.wordId);
        if (!word) return prisma.word.findFirst({ where: { id: "invalid" } }); // Skip

        const newScore =
          review.quality === 0 ? Math.max(0, word.score - 1) : word.score + 1;

        return prisma.word.update({
          where: { id: review.wordId },
          data: {
            easeFactor: review.srsData.easeFactor,
            interval: review.srsData.interval,
            repetitions: review.srsData.repetitions,
            lastReviewed: review.srsData.lastReviewed,
            nextReview: review.srsData.nextReview,
            score: newScore,
          },
        });
      })
    );

    revalidatePath("/dashboard");
    revalidatePath("/flashcards");

    return { success: true };
  } catch (error) {
    console.error("Error submitting batch reviews:", error);
    return { success: false, error: "Failed to submit reviews" };
  }
}
