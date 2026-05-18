/**
 * Streak Calendar API
 * 
 * GET /api/streak/calendar?month=YYYY-MM
 * 
 * Returns daily activity records for a given month
 * Used by calendar UI to display which days user had learning activity
 * 
 * Response:
 * {
 *   month: "2025-01",
 *   days: [
 *     { date: "2025-01-15", totalEvents: 3, hasActivity: true, types: { review: 2, reading_attempt: 1 } },
 *     ...
 *   ],
 *   monthStats: {
 *     daysWithActivity: 18,
 *     totalEvents: 42,
 *     streakAsOf: "2025-01-31"
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/server-auth";
import { getDailyActivityRange } from "@/lib/activity-logger";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdOrNull();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract month from query params (YYYY-MM format)
    const month = request.nextUrl.searchParams.get("month");

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    // Parse month to get start and end dates
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1); // First day of month
    const endDate = new Date(year, monthNum, 0); // Last day of month

    // Get daily activity records for this month
    // Gracefully handle case where table doesn't exist yet (migration not deployed)
    let activitiesInMonth: any[] = [];
    try {
      activitiesInMonth = await getDailyActivityRange(
        userId,
        startDate,
        endDate
      );
    } catch (queryError: any) {
      // If table doesn't exist yet, return empty calendar
      // This allows UI to render while waiting for migration
      if (queryError.code === 'P2021') {
        // Prisma error: relation does not exist
        activitiesInMonth = [];
      } else {
        throw queryError;
      }
    }

    // Transform to calendar format
    const daysArray: {
      date: string;
      totalEvents: number;
      hasActivity: boolean;
      types: Record<string, number>;
    }[] = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD

      const activity = activitiesInMonth.find(
        (a) =>
          new Date(a.activityDate).toISOString().split("T")[0] === dateStr
      );

      daysArray.push({
        date: dateStr,
        totalEvents: activity?.totalEvents || 0,
        hasActivity: (activity?.totalEvents || 0) > 0,
        types: {
          review: activity?.reviewCount || 0,
          reading_attempt: activity?.readingAttemptCount || 0,
          writing_attempt: activity?.writingAttemptCount || 0,
          cefr_learn: activity?.cefrLearnCount || 0,
        },
      });
    }

    // Calculate month statistics
    const daysWithActivity = activitiesInMonth.length;
    const totalEvents = activitiesInMonth.reduce(
      (sum, a) => sum + a.totalEvents,
      0
    );

    return NextResponse.json({
      month,
      days: daysArray,
      monthStats: {
        daysWithActivity,
        totalEvents,
      },
    });
  } catch (error) {
    console.error("Streak calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}
