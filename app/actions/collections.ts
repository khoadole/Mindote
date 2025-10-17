"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { ensureUserExists } from "@/lib/ensure-user";

/**
 * Get all collections for current user
 */
export async function getCollectionsAction() {
  const startTime = Date.now();
  try {
    const userId = await getUserId();
    console.log(`[getCollections] getUserId took ${Date.now() - startTime}ms`);

    const queryStart = Date.now();
    // ✅ Optimized: Only count words, don't fetch all word data
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { words: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log(`[getCollections] DB query took ${Date.now() - queryStart}ms`);
    console.log(`[getCollections] Total took ${Date.now() - startTime}ms`);

    return {
      data: collections.map((col) => ({
        id: col.id,
        name: col.name,
        color: col.color,
        createdAt: col.createdAt.toISOString(),
        wordCount: col._count.words,
      })),
      error: null,
    };
  } catch (error) {
    console.error("Error getting collections:", error);
    // Handle auth errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized", data: null };
    }
    return { error: "Failed to get collections", data: null };
  }
}

/**
 * Get a single collection with words
 */
export async function getCollectionAction(collectionId: string) {
  try {
    const userId = await getUserId();

    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
      include: {
        words: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!collection) {
      return { error: "Collection not found", data: null };
    }

    return {
      data: {
        id: collection.id,
        name: collection.name,
        color: collection.color,
        createdAt: collection.createdAt.toISOString(),
        words: collection.words.map((word) => ({
          id: word.id,
          term: word.term,
          definition: word.definition,
          example: word.example,
          phonetic: word.phonetic,
          score: word.score,
          createdAt: word.createdAt.toISOString(),
          collectionId: word.collectionId,
        })),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting collection:", error);
    return { error: "Failed to get collection", data: null };
  }
}

/**
 * Create a new collection
 */
export async function createCollectionAction(data: {
  name: string;
  color: string;
}) {
  try {
    const userId = await getUserId();

    // ✅ FIX: Ensure user exists in database before creating collection
    // This handles race condition where signup trigger hasn't completed yet
    await ensureUserExists(userId);

    const collection = await prisma.collection.create({
      data: {
        userId,
        name: data.name,
        color: data.color,
      },
    });

    revalidatePath("/collections");

    return {
      data: {
        id: collection.id,
        name: collection.name,
        color: collection.color,
        createdAt: collection.createdAt.toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating collection:", error);
    return { error: "Failed to create collection", data: null };
  }
}

/**
 * Update a collection
 */
export async function updateCollectionAction(
  collectionId: string,
  data: {
    name?: string;
    color?: string;
  }
) {
  try {
    const userId = await getUserId();

    const collection = await prisma.collection.updateMany({
      where: {
        id: collectionId,
        userId,
      },
      data,
    });

    if (collection.count === 0) {
      return { error: "Collection not found", data: null };
    }

    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error("Error updating collection:", error);
    return { error: "Failed to update collection", data: null };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollectionAction(collectionId: string) {
  try {
    const userId = await getUserId();

    const collection = await prisma.collection.deleteMany({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (collection.count === 0) {
      return { error: "Collection not found", data: null };
    }

    revalidatePath("/collections");

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting collection:", error);
    return { error: "Failed to delete collection", data: null };
  }
}
