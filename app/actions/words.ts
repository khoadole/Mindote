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
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const userId = user.id;

  // Ensure user exists in database
  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: user.email!,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email: user.email!,
        username: user.user_metadata?.username || null,
        displayName:
          user.user_metadata?.display_name || user.email?.split("@")[0] || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
    });
  } catch (error) {
    console.error("Error upserting user:", error);
  }

  return userId;
}

/**
 * Get all words for a collection
 */
export async function getWordsAction(collectionId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (!collection) {
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
}) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id: data.collectionId,
        userId,
      },
    });

    if (!collection) {
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
    score?: number;
  }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

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
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

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
 */
export async function getAllWordsAction() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

    const words = await prisma.word.findMany({
      where: {
        collection: {
          userId,
        },
      },
      include: {
        collection: true,
      },
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
 */
export async function searchWordsAction(query: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: "Unauthorized", data: null };
    }

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
      include: {
        collection: true,
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
