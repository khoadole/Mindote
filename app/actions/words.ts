"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

/**
 * Get all words for a collection
 */
export async function getWordsAction(collectionId: string) {
  try {
    const userId = await getUserId();

    // ✅ FIX: Use findUnique to avoid prepared statement cache conflicts
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
    });

    // Verify ownership
    if (!collection || collection.userId !== userId) {
      return { error: "Collection not found", data: null };
    }

    const words = await prisma.word.findMany({
      where: { collectionId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: words.map((word) => ({
        id: word.id,
        term: word.term,
        definition: word.definition,
        example: word.example,
        phonetic: word.phonetic,
        partOfSpeech: word.partOfSpeech,
        score: word.score,
        createdAt: word.createdAt.toISOString(),
        collectionId: word.collectionId,
      })),
      error: null,
    };
  } catch (error) {
    console.error("Error getting words:", error);
    return { error: "Failed to get words", data: null };
  }
}

/**
 * Create a new word
 */
export async function createWordAction(data: {
  collectionId: string;
  term: string;
  definition: string;
  example?: string;
  phonetic?: string;
  partOfSpeech?: string;
}) {
  try {
    const userId = await getUserId();

    // ✅ FIX: Use findUnique to avoid prepared statement cache conflicts
    const collection = await prisma.collection.findUnique({
      where: {
        id: data.collectionId,
      },
    });

    // Verify ownership
    if (!collection || collection.userId !== userId) {
      return { error: "Collection not found", data: null };
    }

    // Check if word already exists in collection
    const existingWord = await prisma.word.findUnique({
      where: {
        collectionId_term: {
          collectionId: data.collectionId,
          term: data.term,
        },
      },
    });

    if (existingWord) {
      return { error: "Word already exists in this collection", data: null };
    }

    const word = await prisma.word.create({
      data: {
        collectionId: data.collectionId,
        term: data.term,
        definition: data.definition,
        example: data.example,
        phonetic: data.phonetic,
        partOfSpeech: data.partOfSpeech,
      },
    });

    revalidatePath(`/collections/${data.collectionId}`);
    revalidatePath("/collections");

    return {
      data: {
        id: word.id,
        term: word.term,
        definition: word.definition,
        example: word.example,
        phonetic: word.phonetic,
        partOfSpeech: word.partOfSpeech,
        score: word.score,
        createdAt: word.createdAt.toISOString(),
        collectionId: word.collectionId,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating word:", error);
    return { error: "Failed to create word", data: null };
  }
}

/**
 * Update a word
 */
export async function updateWordAction(
  wordId: string,
  data: {
    term?: string;
    definition?: string;
    example?: string;
    phonetic?: string;
    partOfSpeech?: string;
    score?: number;
  }
) {
  try {
    const userId = await getUserId();

    // Verify word belongs to user's collection
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        collection: true,
      },
    });

    if (!word || word.collection.userId !== userId) {
      return { error: "Word not found", data: null };
    }

    const updatedWord = await prisma.word.update({
      where: { id: wordId },
      data,
    });

    revalidatePath(`/collections/${word.collectionId}`);

    return {
      data: {
        id: updatedWord.id,
        term: updatedWord.term,
        definition: updatedWord.definition,
        example: updatedWord.example,
        phonetic: updatedWord.phonetic,
        partOfSpeech: updatedWord.partOfSpeech,
        score: updatedWord.score,
        createdAt: updatedWord.createdAt.toISOString(),
        collectionId: updatedWord.collectionId,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error updating word:", error);
    return { error: "Failed to update word", data: null };
  }
}

/**
 * Delete a word
 */
export async function deleteWordAction(wordId: string) {
  try {
    const userId = await getUserId();

    // Verify word belongs to user's collection
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        collection: true,
      },
    });

    if (!word || word.collection.userId !== userId) {
      return { error: "Word not found", data: null };
    }

    await prisma.word.delete({
      where: { id: wordId },
    });

    revalidatePath(`/collections/${word.collectionId}`);
    revalidatePath("/collections");

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting word:", error);
    return { error: "Failed to delete word", data: null };
  }
}

/**
 * Get all words for current user (for Quiz and Flashcards)
 * ✅ OPTIMIZED: Added pagination and better field selection
 */
export async function getAllWordsAction(options?: {
  skip?: number;
  take?: number;
  collectionId?: string;
}) {
  try {
    const userId = await getUserId();
    const { skip = 0, take = 1000, collectionId } = options || {};

    const words = await prisma.word.findMany({
      where: {
        collection: {
          userId,
        },
        ...(collectionId && { collectionId }),
      },
      select: {
        id: true,
        term: true,
        definition: true,
        example: true,
        phonetic: true,
        partOfSpeech: true,
        score: true,
        createdAt: true,
        collectionId: true,
        collection: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: words.map((word) => ({
        id: word.id,
        term: word.term,
        definition: word.definition,
        example: word.example,
        phonetic: word.phonetic,
        partOfSpeech: word.partOfSpeech,
        score: word.score,
        createdAt: word.createdAt.toISOString(),
        collectionId: word.collectionId,
        collectionName: word.collection.name,
        collectionColor: word.collection.color,
      })),
      error: null,
    };
  } catch (error) {
    console.error("Error getting all words:", error);
    return { error: "Failed to get words", data: null };
  }
}

/**
 * Search words across all user's collections
 * ✅ OPTIMIZED: Better field selection and limit
 */
export async function searchWordsAction(query: string) {
  try {
    const userId = await getUserId();

    const words = await prisma.word.findMany({
      where: {
        collection: {
          userId,
        },
        OR: [
          {
            term: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            definition: {
              contains: query,
              mode: "insensitive",
            },
          },
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
        createdAt: true,
        collectionId: true,
        collection: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      take: 50,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: words.map((word) => ({
        id: word.id,
        term: word.term,
        definition: word.definition,
        example: word.example,
        phonetic: word.phonetic,
        partOfSpeech: word.partOfSpeech,
        score: word.score,
        createdAt: word.createdAt.toISOString(),
        collectionId: word.collectionId,
        collectionName: word.collection.name,
        collectionColor: word.collection.color,
      })),
      error: null,
    };
  } catch (error) {
    console.error("Error searching words:", error);
    return { error: "Failed to search words", data: null };
  }
}
