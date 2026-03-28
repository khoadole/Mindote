import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import { logActivity } from "@/lib/activity-logger";
import { updateUserStreakAction } from "@/app/actions/settings";

// GET: Get user's learning progress for CEFR vocabulary
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ 
        authenticated: false,
        progress: {} 
      });
    }

    // Get all learned words by the user
    const learnedWords = await prisma.cEFRWordProgress.findMany({
      where: { userId },
      select: {
        wordId: true,
        word: {
          select: {
            topicId: true,
            topic: {
              select: {
                level: true,
              },
            },
          },
        },
      },
    });

    // Organize by level and topic
    const progressByLevel: Record<string, {
      learnedCount: number;
      wordIds: string[];
      byTopic: Record<string, number>;
    }> = {};

    learnedWords.forEach((lw) => {
      const level = lw.word.topic.level;
      const topicId = lw.word.topicId;

      if (!progressByLevel[level]) {
        progressByLevel[level] = {
          learnedCount: 0,
          wordIds: [],
          byTopic: {},
        };
      }

      progressByLevel[level].learnedCount++;
      progressByLevel[level].wordIds.push(lw.wordId);
      progressByLevel[level].byTopic[topicId] = (progressByLevel[level].byTopic[topicId] || 0) + 1;
    });

    return NextResponse.json({
      authenticated: true,
      progress: progressByLevel,
    });
  } catch (error) {
    console.error("Error fetching CEFR progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch CEFR progress" },
      { status: 500 }
    );
  }
}

// POST: Mark a word as learned/unlearned
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { wordId, learned } = await request.json();

    if (!wordId) {
      return NextResponse.json(
        { error: "wordId is required" },
        { status: 400 }
      );
    }

    if (learned === false) {
      // Remove the progress record (unlearn)
      await prisma.cEFRWordProgress.deleteMany({
        where: {
          userId,
          wordId,
        },
      });

      return NextResponse.json({ success: true, learned: false });
    } else {
      // Mark as learned (upsert to handle duplicates)
      await prisma.cEFRWordProgress.upsert({
        where: {
          userId_wordId: {
            userId,
            wordId,
          },
        },
        create: {
          userId,
          wordId,
          learned: true,
        },
        update: {
          learned: true,
          learnedAt: new Date(),
        },
      });

      // Log learning activity for streak tracking
      try {
        const activityResult = await logActivity({
          userId,
          activityType: "cefr_learn",
        });
        console.log("[Activity Logger] CEFR learn logged:", { userId, activityResult });

        // Recalculate streak
        try {
          const streakResult = await updateUserStreakAction();
          console.log("[Streak Update] Streak recalculated:", streakResult);
        } catch (streakError) {
          console.warn("[Streak Update] Failed to recalculate streak:", streakError);
        }
      } catch (activityError) {
        console.error("[Activity Logger] Failed to log CEFR learn activity:", activityError);
      }

      return NextResponse.json({ success: true, learned: true });
    }
  } catch (error) {
    console.error("Error updating CEFR progress:", error);
    return NextResponse.json(
      { error: "Failed to update CEFR progress" },
      { status: 500 }
    );
  }
}
