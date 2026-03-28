/**
 * Activity Logger for Streak Tracking
 * 
 * Logs learning activities into user_daily_activity table
 * to support activity-based streak calculation (not login-based).
 * 
 * Edge Cases Handled:
 * 1. Multiple activities on same day → only +1 total_events per upsert
 * 2. Timezone-aware date conversion using user's configured timezone
 * 3. Duplicate prevention via UNIQUE constraint on (user_id, activity_date)
 * 4. Activity counter increments based on type
 * 5. Backward-compatible: doesn't backfill, only tracks from deployment forward
 */

import { prisma } from "@/lib/prisma";

interface ActivityLoggerOptions {
  userId: string;
  activityType:
    | "review"
    | "reading_attempt"
    | "writing_attempt"
    | "cefr_learn"
    | "word_created";
  timezone?: string; // Default: "Asia/Ho_Chi_Minh"
}

/**
 * Get user's configured timezone or use default
 */
async function getUserTimezone(userId: string): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { userId },
    select: { language: true }, // Could be extended to support timezone column in future
  });

  // TODO: Add timezone column to Setting model when user settings UI is extended
  // For now, default to Asia/Ho_Chi_Minh (Vietnam timezone)
  return "Asia/Ho_Chi_Minh";
}

/**
 * Convert current time to user's timezone and extract date
 * 
 * This ensures we attribute activity to the correct calendar day
 * in the user's local timezone, not UTC.
 */
function getTodayInTimezone(timezone: string): Date {
  // Create a date formatter in the user's timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(new Date()).split("-");
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

/**
 * Log a learning activity and update daily activity record
 * 
 * Upserts into user_daily_activity table:
 * - Creates new record if activity_date doesn't exist yet
 * - Updates existing record if activity_date exists (increments counters)
 * - Maintains activity type counters (review, reading, writing, cefr, word_created)
 * - Updates lastActivityAt timestamp on each activity
 * 
 * @throws Error if database operation fails
 * @returns Updated UserDailyActivity record
 */
export async function logActivity(
  options: ActivityLoggerOptions
): Promise<any> {
  const { userId, activityType, timezone: overrideTimezone } = options;

  try {
    // Get user's timezone (can be overridden for testing)
    const timezone = overrideTimezone || (await getUserTimezone(userId));

    // Get today's date in user's timezone
    const activityDate = getTodayInTimezone(timezone);
    console.log(`[ActivityLogger] Logging ${activityType} for user ${userId} on date ${activityDate.toISOString().split('T')[0]}`);

    // Map activity type to counter field
    const getCounterIncrement = (type: string): any => {
      const now = new Date();
      const baseUpdate = {
        lastActivityAt: now,
        totalEvents: { increment: 1 },
      };

      switch (type) {
        case "review":
          return { ...baseUpdate, reviewCount: { increment: 1 } };
        case "reading_attempt":
          return { ...baseUpdate, readingAttemptCount: { increment: 1 } };
        case "writing_attempt":
          return { ...baseUpdate, writingAttemptCount: { increment: 1 } };
        case "cefr_learn":
          return { ...baseUpdate, cefrLearnCount: { increment: 1 } };
        case "word_created":
          return { ...baseUpdate, wordCreatedCount: { increment: 1 } };
        default:
          return baseUpdate;
      }
    };

    // Upsert activity record
    // If activity_date exists, increment counters. Otherwise create new.
    let dailyActivity: any;
    try {
      dailyActivity = await prisma.userDailyActivity.upsert({
        where: {
          userId_activityDate: {
            userId,
            activityDate,
          },
        },
        update: getCounterIncrement(activityType),
        create: {
          userId,
          activityDate,
          firstActivityAt: new Date(),
          lastActivityAt: new Date(),
          totalEvents: 1,
          reviewCount: activityType === "review" ? 1 : 0,
          readingAttemptCount: activityType === "reading_attempt" ? 1 : 0,
          writingAttemptCount: activityType === "writing_attempt" ? 1 : 0,
          cefrLearnCount: activityType === "cefr_learn" ? 1 : 0,
          wordCreatedCount: activityType === "word_created" ? 1 : 0,
        },
      });
      console.log(`[ActivityLogger] Success: ${activityType} logged`, { dailyActivity });
    } catch (upsertError: any) {
      console.warn(`[ActivityLogger] Upsert failed, trying manual create/update:`, upsertError.message);
      // Fallback: try manual find first
      const existing = await prisma.userDailyActivity.findFirst({
        where: {
          userId,
          activityDate,
        },
      });

      if (existing) {
        // Update existing
        const counters = getCounterIncrement(activityType);
        dailyActivity = await prisma.userDailyActivity.update({
          where: { id: existing.id },
          data: counters,
        });
        console.log(`[ActivityLogger] Updated existing record`);
      } else {
        // Create new
        dailyActivity = await prisma.userDailyActivity.create({
          data: {
            userId,
            activityDate,
            firstActivityAt: new Date(),
            lastActivityAt: new Date(),
            totalEvents: 1,
            reviewCount: activityType === "review" ? 1 : 0,
            readingAttemptCount: activityType === "reading_attempt" ? 1 : 0,
            writingAttemptCount: activityType === "writing_attempt" ? 1 : 0,
            cefrLearnCount: activityType === "cefr_learn" ? 1 : 0,
            wordCreatedCount: activityType === "word_created" ? 1 : 0,
          },
        });
        console.log(`[ActivityLogger] Created new record`);
      }
    }

    return dailyActivity;
  } catch (error) {
    console.error(
      `[ActivityLogger] Failed to log ${activityType} for user ${userId}:`,
      error instanceof Error ? error.message : error
    );
    // Don't throw - activity logging should not break user experience
    // Log errors but let the main action continue
    return null;
  }
}

/**
 * Get daily activity records for a date range
 * Used by calendar UI to display which days had activity
 */
export async function getDailyActivityRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  try {
    const activities = await prisma.userDailyActivity.findMany({
      where: {
        userId,
        activityDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { activityDate: "desc" },
    });

    return activities;
  } catch (error) {
    console.error(
      `[ActivityLogger] Failed to fetch activity range for user ${userId}:`,
      error
    );
    return [];
  }
}

/**
 * Calculate consecutive day streak from daily activity records
 * 
 * Algorithm:
 * 1. Query daily_activity in DESC order from today backwards
 * 2. Count consecutive days with total_events > 0
 * 3. Stop when gap is found (no activity for that day)
 * 
 * @returns Streak count (0 if no activity today or yesterday breaks chain)
 */
export async function calculateStreakFromActivity(
  userId: string,
  timezone: string = "Asia/Ho_Chi_Minh"
): Promise<number> {
  try {
    // Get today in user's timezone
    const TODAY = getTodayInTimezone(timezone);
    console.log(`[Streak Calculation] For user ${userId}, timezone ${timezone}, today is ${TODAY.toISOString().split('T')[0]}`);

    // Query activities from today backwards
    const activities = await prisma.userDailyActivity.findMany({
      where: { userId },
      orderBy: { activityDate: "desc" },
      take: 100, // Fetch up to 100 days to find streak
      select: { activityDate: true, totalEvents: true },
    });

    console.log(`[Streak Calculation] Found ${activities.length} activity records`);

    if (activities.length === 0) {
      console.log(`[Streak Calculation] No activities found, streak = 0`);
      return 0; // No activity ever
    }

    let streak = 0;
    let currentDate = TODAY;

    for (const activity of activities) {
      const activityDateOnly = new Date(activity.activityDate);
      activityDateOnly.setUTCHours(0, 0, 0, 0);
      currentDate.setUTCHours(0, 0, 0, 0);

      const activityDateStr = activityDateOnly.toISOString().split('T')[0];
      const currentDateStr = currentDate.toISOString().split('T')[0];

      // Check if this activity is on the expected date
      if (
        activityDateOnly.getTime() === currentDate.getTime() &&
        activity.totalEvents > 0
      ) {
        streak++;
        console.log(`[Streak Calculation] Found activity on ${activityDateStr}, streak = ${streak}`);
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (activityDateOnly.getTime() < currentDate.getTime()) {
        // Gap found - activity doesn't exist for current day
        console.log(`[Streak Calculation] Gap found: expected ${currentDateStr} but got ${activityDateStr}, stopping at streak=${streak}`);
        break;
      }
    }

    console.log(`[Streak Calculation] Final streak value: ${streak}`);
    return streak;
  } catch (error) {
    console.error(
      `[ActivityLogger] Failed to calculate streak for user ${userId}:`,
      error
    );
    return 0;
  }
}

export default { logActivity, getDailyActivityRange, calculateStreakFromActivity };
