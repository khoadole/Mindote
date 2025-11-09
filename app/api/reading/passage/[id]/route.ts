import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching passage:", params.id, "for user:", userId);

    const passage = await prisma.readingPassage.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    console.log("Passage found:", !!passage);

    if (!passage) {
      return NextResponse.json({ error: "Passage not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: passage,
    });
  } catch (error: any) {
    console.error("Fetch passage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch passage" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a reading passage
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if passage belongs to user
    const passage = await prisma.readingPassage.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!passage) {
      return NextResponse.json(
        { error: "Passage not found" },
        { status: 404 }
      );
    }

    // Delete the passage (attempts will be cascade deleted)
    await prisma.readingPassage.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Passage deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete passage error:", error);
    return NextResponse.json(
      { error: "Failed to delete passage" },
      { status: 500 }
    );
  }
}
