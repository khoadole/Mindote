/**
 * Spaced Repetition System (SRS) - SM-2 Algorithm
 * Based on SuperMemo SM-2 algorithm
 * 
 * Quality responses:
 * - Again (0): Complete blackout
 * - Good (3): Correct response with difficulty
 * - Easy (5): Perfect response
 */

export type ReviewQuality = 0 | 3 | 5;

export interface SRSData {
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastReviewed: Date;
  nextReview: Date;
}

/**
 * Calculate next review date based on SM-2 algorithm
 * @param quality - Review quality (0=Again, 3=Good, 5=Easy)
 * @param currentData - Current SRS data
 * @returns Updated SRS data
 */
export function calculateNextReview(
  quality: ReviewQuality,
  currentData?: Partial<SRSData>
): SRSData {
  const now = new Date();
  
  // Default values for new words
  let easeFactor = currentData?.easeFactor ?? 2.5;
  let interval = currentData?.interval ?? 0;
  let repetitions = currentData?.repetitions ?? 0;

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate new interval
  if (quality === 0) {
    // Again - reset progress
    repetitions = 0;
    interval = 0;
  } else {
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1; // 1 day
    } else if (repetitions === 2) {
      interval = 3; // 3 days
    } else {
      // interval = previous interval * ease factor
      interval = Math.round(interval * easeFactor);
    }

    // Apply quality modifier
    if (quality === 5) {
      // Easy - add bonus days
      interval = Math.round(interval * 1.3);
    }
  }

  // Calculate next review date
  const nextReview = new Date(now);
  if (quality === 0) {
    // Again - review immediately (due now)
    // Set to current time so it appears in "due today" immediately
    nextReview.setSeconds(nextReview.getSeconds() - 1);
  } else {
    nextReview.setDate(nextReview.getDate() + interval);
  }

  return {
    easeFactor,
    interval,
    repetitions,
    lastReviewed: now,
    nextReview,
  };
}

/**
 * Check if a word is due for review
 * @param nextReview - Next review date
 * @returns true if word is due
 */
export function isDue(nextReview: Date | null | undefined): boolean {
  if (!nextReview) return true; // New words are always due
  return new Date() >= new Date(nextReview);
}

/**
 * Get the number of days until next review
 * @param nextReview - Next review date
 * @returns Days until next review (negative if overdue)
 */
export function getDaysUntilReview(nextReview: Date | null | undefined): number {
  if (!nextReview) return 0;
  const now = new Date();
  const diff = new Date(nextReview).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get review interval description
 * @param interval - Interval in days
 * @returns Human-readable interval
 */
export function getIntervalDescription(interval: number): string {
  if (interval === 0) return "New";
  if (interval === 1) return "1 day";
  if (interval < 7) return `${interval} days`;
  if (interval < 30) return `${Math.round(interval / 7)} weeks`;
  if (interval < 365) return `${Math.round(interval / 30)} months`;
  return `${Math.round(interval / 365)} years`;
}

/**
 * Review result to be saved after session
 */
export interface ReviewResult {
  wordId: string;
  quality: ReviewQuality;
  srsData: SRSData;
}
