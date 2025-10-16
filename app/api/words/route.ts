import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

/**
 * GET /api/words
 * Get all words for authenticated user (across all collections)
 */
export async function GET() {
  try {
    const userId = await getUserId();

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

    return NextResponse.json(words);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching words:", error);
    return NextResponse.json(
      { error: "Failed to fetch words" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/words
 * Create a new word in a collection
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const { term, definition, example, phonetic, collectionId } = body;

    if (!term || !definition || !collectionId) {
      return NextResponse.json(
        { error: "Term, definition, and collectionId are required" },
        { status: 400 }
      );
    }

    // Verify user owns the collection
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found or access denied" },
        { status: 404 }
      );
    }

    // Check for duplicate term in collection
    const existingWord = await prisma.word.findUnique({
      where: {
        collectionId_term: {
          collectionId,
          term,
        },
      },
    });

    if (existingWord) {
      return NextResponse.json(
        { error: "This term already exists in this collection" },
        { status: 409 }
      );
    }

    const word = await prisma.word.create({
      data: {
        term,
        definition,
        example,
        phonetic,
        collectionId,
      },
    });

    return NextResponse.json(word, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating word:", error);
    return NextResponse.json(
      { error: "Failed to create word" },
      { status: 500 }
    );
  }
}
