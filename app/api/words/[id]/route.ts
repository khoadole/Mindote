import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

type Params = {
  id: string;
};

/**
 * GET /api/words/[id]
 * Get a single word
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const userId = await getUserId();
    const { id } = params;

    const word = await prisma.word.findFirst({
      where: {
        id,
        collection: {
          userId,
        },
      },
      include: {
        collection: true,
      },
    });

    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    return NextResponse.json(word);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching word:", error);
    return NextResponse.json(
      { error: "Failed to fetch word" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/words/[id]
 * Update a word
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const userId = await getUserId();
    const { id } = params;
    const body = await request.json();

    // Verify ownership through collection
    const existingWord = await prisma.word.findFirst({
      where: {
        id,
        collection: {
          userId,
        },
      },
    });

    if (!existingWord) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const { term, definition, example, phonetic, score } = body;

    const word = await prisma.word.update({
      where: { id },
      data: {
        ...(term && { term }),
        ...(definition && { definition }),
        ...(example !== undefined && { example }),
        ...(phonetic !== undefined && { phonetic }),
        ...(score !== undefined && { score }),
      },
    });

    return NextResponse.json(word);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating word:", error);
    return NextResponse.json(
      { error: "Failed to update word" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/words/[id]
 * Delete a word
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const userId = await getUserId();
    const { id } = params;

    // Verify ownership through collection
    const existingWord = await prisma.word.findFirst({
      where: {
        id,
        collection: {
          userId,
        },
      },
    });

    if (!existingWord) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    await prisma.word.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting word:", error);
    return NextResponse.json(
      { error: "Failed to delete word" },
      { status: 500 }
    );
  }
}
