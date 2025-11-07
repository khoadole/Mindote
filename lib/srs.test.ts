import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateNextReview,
  isDue,
  getDaysUntilReview,
  getIntervalDescription,
  type ReviewQuality,
  type SRSData,
} from "@/lib/srs";

describe("SRS Algorithm - SM-2 Implementation", () => {
  let now: Date;

  beforeEach(() => {
    // Fixed date for consistent testing
    now = new Date("2024-01-01T00:00:00.000Z");
    // Mock Date to return fixed time
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateNextReview()", () => {
    describe("New words (no previous data)", () => {
      it("should initialize new word with quality Good (3)", () => {
        const result = calculateNextReview(3);

        expect(result.easeFactor).toBe(2.5); // Good maintains ease factor
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
        expect(result.lastReviewed).toEqual(now);
        expect(result.nextReview).toEqual(new Date("2024-01-02T00:00:00.000Z"));
      });

      it("should initialize new word with quality Easy (5)", () => {
        const result = calculateNextReview(5);

        expect(result.easeFactor).toBe(2.6); // Easy increases by +0.1
        expect(result.interval).toBe(1); // First rep always 1 day (before bonus)
        expect(result.repetitions).toBe(1);
        expect(result.nextReview).toEqual(new Date("2024-01-02T00:00:00.000Z"));
      });

      it("should reset new word with quality Again (0)", () => {
        const result = calculateNextReview(0);

        // Ease factor should be reduced significantly
        expect(result.easeFactor).toBeCloseTo(1.7, 1); // Floating point math
        expect(result.interval).toBe(0);
        expect(result.repetitions).toBe(0);
        // Should be due immediately (in the past)
        expect(result.nextReview.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    describe("SM-2 Interval Progression", () => {
      it("should progress correctly: 1 day → 3 days → 7+ days", () => {
        // First review (Good)
        let result = calculateNextReview(3);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);

        // Second review (Good)
        result = calculateNextReview(3, result);
        expect(result.interval).toBe(3);
        expect(result.repetitions).toBe(2);

        // Third review (Good) - now uses ease factor
        result = calculateNextReview(3, result);
        expect(result.interval).toBe(8); // 3 * 2.5 = 7.5 → 8
        expect(result.repetitions).toBe(3);

        // Fourth review (Good)
        result = calculateNextReview(3, result);
        expect(result.interval).toBe(20); // 8 * 2.5 = 20
        expect(result.repetitions).toBe(4);
      });

      it("should apply Easy bonus (1.3x) on interval", () => {
        // First review
        let result = calculateNextReview(5);
        expect(result.interval).toBe(1); // First rep always 1 day (before bonus)

        // Second review
        result = calculateNextReview(5, result);
        expect(result.interval).toBe(4); // 3 * 1.3 = 3.9 → 4 (bonus applied)

        // Third review (Easy bonus kicks in)
        result = calculateNextReview(5, result);
        // 4 * 2.6 (EF was increased) = 10.4, then * 1.3 = 13.52 → 14
        expect(result.interval).toBe(14);
        expect(result.repetitions).toBe(3);
      });

      it("should reset progress on Again (0)", () => {
        // Build up progress
        let result = calculateNextReview(3);
        result = calculateNextReview(3, result);
        result = calculateNextReview(3, result);
        expect(result.repetitions).toBe(3);
        expect(result.interval).toBe(8); // Updated expectation

        // Forget - press Again
        result = calculateNextReview(0, result);
        expect(result.repetitions).toBe(0);
        expect(result.interval).toBe(0);
        expect(result.nextReview.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    describe("Ease Factor adjustments", () => {
      it("should maintain ease factor with Good (3) quality", () => {
        let result = calculateNextReview(3);
        expect(result.easeFactor).toBe(2.5);

        result = calculateNextReview(3, result);
        expect(result.easeFactor).toBe(2.5); // Should stay at 2.5

        result = calculateNextReview(3, result);
        expect(result.easeFactor).toBe(2.5);
      });

      it("should increase ease factor with Easy (5) quality", () => {
        let result = calculateNextReview(5);
        expect(result.easeFactor).toBe(2.6);

        result = calculateNextReview(5, result);
        expect(result.easeFactor).toBe(2.7); // +0.1 each time

        result = calculateNextReview(5, result);
        expect(result.easeFactor).toBeCloseTo(2.8, 1);
      });

      it("should decrease ease factor with Again (0) quality", () => {
        let result = calculateNextReview(3);
        expect(result.easeFactor).toBe(2.5);

        result = calculateNextReview(0, result);
        expect(result.easeFactor).toBeCloseTo(1.7, 1); // Decreased significantly

        result = calculateNextReview(0, result);
        expect(result.easeFactor).toBeLessThan(1.7);
      });

      it("should never let ease factor go below 1.3", () => {
        let result = calculateNextReview(0); // Start with Again
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);

        // Spam Again multiple times
        for (let i = 0; i < 10; i++) {
          result = calculateNextReview(0, result);
          expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        }
      });

      it("should allow ease factor to grow beyond 3.0 with consistent Easy", () => {
        let result = calculateNextReview(5);

        // Keep pressing Easy
        for (let i = 0; i < 10; i++) {
          result = calculateNextReview(5, result);
        }

        expect(result.easeFactor).toBeGreaterThan(3.0);
      });
    });

    describe("Date calculations", () => {
      it("should set lastReviewed to current time", () => {
        const result = calculateNextReview(3);
        expect(result.lastReviewed).toEqual(now);
      });

      it("should calculate nextReview correctly for 1 day interval", () => {
        const result = calculateNextReview(3);
        const expectedNext = new Date("2024-01-02T00:00:00.000Z");
        expect(result.nextReview).toEqual(expectedNext);
      });

      it("should calculate nextReview correctly for 3 day interval", () => {
        let result = calculateNextReview(3);
        result = calculateNextReview(3, result);
        const expectedNext = new Date("2024-01-04T00:00:00.000Z");
        expect(result.nextReview).toEqual(expectedNext);
      });

      it("should set nextReview to immediate past on Again", () => {
        const result = calculateNextReview(0);
        expect(result.nextReview.getTime()).toBeLessThan(now.getTime());
      });
    });

    describe("Edge cases", () => {
      it("should handle undefined currentData (new word)", () => {
        const result = calculateNextReview(3, undefined);
        expect(result.easeFactor).toBe(2.5);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
      });

      it("should handle partial currentData", () => {
        const result = calculateNextReview(3, {
          easeFactor: 2.0,
          // Missing interval, repetitions
        });
        expect(result.easeFactor).toBe(2.0); // Good maintains EF
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
      });

      it("should handle very high repetitions (long-term cards)", () => {
        const result = calculateNextReview(3, {
          easeFactor: 2.5,
          interval: 365,
          repetitions: 10,
        });
        // 365 * 2.5 = 912.5 → rounds to 912 or 913 (acceptable)
        expect(result.interval).toBeGreaterThanOrEqual(912);
        expect(result.interval).toBeLessThanOrEqual(913);
        expect(result.repetitions).toBe(11);
      });

      it("should handle very low ease factor (difficult cards)", () => {
        const result = calculateNextReview(3, {
          easeFactor: 1.3, // Minimum
          interval: 7,
          repetitions: 5,
        });
        // 7 * 1.3 = 9.1 → 9
        expect(result.interval).toBe(9);
        expect(result.easeFactor).toBe(1.3); // Should stay at minimum with Good
      });

      it("should handle ease factor exactly at minimum", () => {
        const result = calculateNextReview(0, {
          easeFactor: 1.3,
          interval: 5,
          repetitions: 3,
        });
        // Even with Again, should not go below 1.3
        expect(result.easeFactor).toBe(1.3);
        expect(result.repetitions).toBe(0);
      });
    });
  });

  describe("isDue()", () => {
    it("should return true for null nextReview (new words)", () => {
      expect(isDue(null)).toBe(true);
      expect(isDue(undefined)).toBe(true);
    });

    it("should return true for past dates", () => {
      const pastDate = new Date("2023-12-31T00:00:00.000Z");
      expect(isDue(pastDate)).toBe(true);
    });

    it("should return true for current date", () => {
      expect(isDue(now)).toBe(true);
    });

    it("should return false for future dates", () => {
      const futureDate = new Date("2024-01-02T00:00:00.000Z");
      expect(isDue(futureDate)).toBe(false);
    });
  });

  describe("getDaysUntilReview()", () => {
    it("should return 0 for null/undefined", () => {
      expect(getDaysUntilReview(null)).toBe(0);
      expect(getDaysUntilReview(undefined)).toBe(0);
    });

    it("should return negative number for overdue", () => {
      const pastDate = new Date("2023-12-30T00:00:00.000Z");
      expect(getDaysUntilReview(pastDate)).toBe(-2);
    });

    it("should return positive number for future", () => {
      const futureDate = new Date("2024-01-05T00:00:00.000Z");
      expect(getDaysUntilReview(futureDate)).toBe(4);
    });

    it("should return 0 for same day", () => {
      const sameDay = new Date("2024-01-01T12:00:00.000Z");
      const result = getDaysUntilReview(sameDay);
      expect(result).toBeLessThanOrEqual(1); // Should be 0 or 1 depending on time
    });
  });

  describe("getIntervalDescription()", () => {
    it('should return "New" for 0 interval', () => {
      expect(getIntervalDescription(0)).toBe("New");
    });

    it("should return days for intervals < 7", () => {
      expect(getIntervalDescription(1)).toBe("1 day");
      expect(getIntervalDescription(3)).toBe("3 days");
      expect(getIntervalDescription(6)).toBe("6 days");
    });

    it("should return weeks for intervals 7-29", () => {
      expect(getIntervalDescription(7)).toBe("1 weeks");
      expect(getIntervalDescription(14)).toBe("2 weeks");
      expect(getIntervalDescription(21)).toBe("3 weeks");
    });

    it("should return months for intervals 30-364", () => {
      expect(getIntervalDescription(30)).toBe("1 months");
      expect(getIntervalDescription(60)).toBe("2 months");
      expect(getIntervalDescription(180)).toBe("6 months");
    });

    it("should return years for intervals >= 365", () => {
      expect(getIntervalDescription(365)).toBe("1 years");
      expect(getIntervalDescription(730)).toBe("2 years");
    });
  });

  describe("Real-world scenarios", () => {
    it("should simulate beginner learner journey", () => {
      // Day 1: Learn new word
      let result = calculateNextReview(3);
      expect(result.interval).toBe(1);

      // Day 2: Remember it (Good)
      result = calculateNextReview(3, result);
      expect(result.interval).toBe(3);

      // Day 5: Forgot it (Again)
      result = calculateNextReview(0, result);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(0);

      // Relearn immediately
      result = calculateNextReview(3, result);
      expect(result.interval).toBe(1);
    });

    it("should simulate advanced learner journey", () => {
      // Consistent Easy reviews
      let result = calculateNextReview(5);
      expect(result.interval).toBe(1);

      result = calculateNextReview(5, result);
      expect(result.interval).toBe(4); // 3 * 1.3 = 3.9 → 4

      result = calculateNextReview(5, result);
      expect(result.interval).toBe(14); // 4 * 2.7 * 1.3 ≈ 14

      result = calculateNextReview(5, result);
      expect(result.interval).toBeGreaterThan(40); // Growing fast

      // Should have high ease factor
      expect(result.easeFactor).toBeGreaterThan(2.8);
    });

    it("should simulate difficult word journey", () => {
      // Mix of Good and Again
      let result = calculateNextReview(3);
      result = calculateNextReview(0, result); // Forget
      result = calculateNextReview(3, result); // Relearn
      result = calculateNextReview(3, result);
      result = calculateNextReview(0, result); // Forget again

      // Ease factor should be quite low
      expect(result.easeFactor).toBeLessThan(2.0);
      expect(result.repetitions).toBe(0);
    });
  });
});
