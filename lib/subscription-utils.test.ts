import { describe, it, expect } from "vitest";
import {
  filterActiveSubscriptions,
  sortSubscriptionsByRenewalDate,
  getActiveAndScheduledSubscriptions,
  Subscription,
} from "./subscription-utils";

// Test data based on the use cases from requirements
const createSubscription = (
  overrides: Partial<Subscription>
): Subscription => ({
  id: "test-id",
  status: "active",
  plan: { variantId: 1087650, productName: "Monthly", interval: "month" },
  renewsAt: "2025-01-31T10:00:00Z",
  price: "799",
  ...overrides,
});

describe("filterActiveSubscriptions", () => {
  it("includes active subscriptions", () => {
    const subs = [createSubscription({ status: "active" })];
    expect(filterActiveSubscriptions(subs)).toHaveLength(1);
  });

  it("includes on_trial subscriptions", () => {
    const subs = [createSubscription({ status: "on_trial" })];
    expect(filterActiveSubscriptions(subs)).toHaveLength(1);
  });

  it("includes cancelled subscriptions that have not expired", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const subs = [
      createSubscription({
        status: "cancelled",
        endsAt: futureDate.toISOString(),
      }),
    ];
    expect(filterActiveSubscriptions(subs)).toHaveLength(1);
  });

  it("excludes cancelled subscriptions that have expired", () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    const subs = [
      createSubscription({
        status: "cancelled",
        endsAt: pastDate.toISOString(),
      }),
    ];
    expect(filterActiveSubscriptions(subs)).toHaveLength(0);
  });

  it("excludes expired subscriptions", () => {
    const subs = [createSubscription({ status: "expired" })];
    expect(filterActiveSubscriptions(subs)).toHaveLength(0);
  });
});

describe("sortSubscriptionsByRenewalDate", () => {
  it("sorts by renewsAt date ascending", () => {
    const subs = [
      createSubscription({ id: "2", renewsAt: "2026-01-31T10:00:00Z" }),
      createSubscription({ id: "1", renewsAt: "2025-01-31T10:00:00Z" }),
    ];
    const sorted = sortSubscriptionsByRenewalDate(subs);
    expect(sorted[0].id).toBe("1");
    expect(sorted[1].id).toBe("2");
  });

  it("falls back to endsAt when renewsAt is not available", () => {
    const subs = [
      createSubscription({
        id: "2",
        renewsAt: undefined,
        endsAt: "2026-01-31T10:00:00Z",
      }),
      createSubscription({
        id: "1",
        renewsAt: undefined,
        endsAt: "2025-01-31T10:00:00Z",
      }),
    ];
    const sorted = sortSubscriptionsByRenewalDate(subs);
    expect(sorted[0].id).toBe("1");
    expect(sorted[1].id).toBe("2");
  });

  it("does not mutate the original array", () => {
    const subs = [
      createSubscription({ id: "2", renewsAt: "2026-01-31T10:00:00Z" }),
      createSubscription({ id: "1", renewsAt: "2025-01-31T10:00:00Z" }),
    ];
    const sorted = sortSubscriptionsByRenewalDate(subs);
    expect(subs[0].id).toBe("2"); // Original unchanged
    expect(sorted[0].id).toBe("1"); // Sorted result
  });
});

describe("getActiveAndScheduledSubscriptions", () => {
  describe("Use Case 1: Only Monthly Subscription", () => {
    it("returns monthly as current, null as scheduled", () => {
      const subs: Subscription[] = [
        {
          id: "24153144",
          status: "active",
          plan: { variantId: 1087650, productName: "Monthly", interval: "month" },
          renewsAt: "2025-01-31T10:00:00Z",
          price: "799",
        },
      ];

      const { current, scheduled } = getActiveAndScheduledSubscriptions(subs);

      expect(current).not.toBeNull();
      expect(current?.plan.variantId).toBe(1087650);
      expect(current?.plan.productName).toBe("Monthly");
      expect(scheduled).toBeNull();
    });
  });

  describe("Use Case 2: Only Yearly Subscription", () => {
    it("returns yearly as current, null as scheduled", () => {
      const subs: Subscription[] = [
        {
          id: "24153143",
          status: "active",
          plan: { variantId: 1087727, productName: "Yearly", interval: "year" },
          renewsAt: "2026-01-01T10:00:00Z",
          price: "7188",
        },
      ];

      const { current, scheduled } = getActiveAndScheduledSubscriptions(subs);

      expect(current).not.toBeNull();
      expect(current?.plan.variantId).toBe(1087727);
      expect(current?.plan.productName).toBe("Yearly");
      expect(scheduled).toBeNull();
    });
  });

  describe("Use Case 3: Monthly → Yearly (Upgrade)", () => {
    it("returns monthly as current (earliest), yearly as scheduled", () => {
      const subs: Subscription[] = [
        {
          id: "24153144",
          status: "active",
          plan: { variantId: 1087650, productName: "Monthly", interval: "month" },
          renewsAt: "2025-01-31T10:00:00Z", // EARLIEST = CURRENT
          price: "799",
        },
        {
          id: "24153143",
          status: "active",
          plan: { variantId: 1087727, productName: "Yearly", interval: "year" },
          startsAt: "2025-01-31T10:00:00Z",
          renewsAt: "2026-01-31T10:00:00Z", // LATER = SCHEDULED
          price: "7188",
        },
      ];

      const { current, scheduled } = getActiveAndScheduledSubscriptions(subs);

      expect(current).not.toBeNull();
      expect(current?.plan.variantId).toBe(1087650);
      expect(current?.plan.productName).toBe("Monthly");

      expect(scheduled).not.toBeNull();
      expect(scheduled?.plan.variantId).toBe(1087727);
      expect(scheduled?.plan.productName).toBe("Yearly");
    });
  });

  describe("Use Case 4: Yearly → Monthly (Downgrade)", () => {
    it("returns yearly as current (earliest), monthly as scheduled", () => {
      const subs: Subscription[] = [
        {
          id: "24153143",
          status: "active",
          plan: { variantId: 1087727, productName: "Yearly", interval: "year" },
          renewsAt: "2026-01-01T10:00:00Z", // EARLIEST = CURRENT
          price: "7188",
        },
        {
          id: "24153144",
          status: "active",
          plan: { variantId: 1087650, productName: "Monthly", interval: "month" },
          startsAt: "2026-01-01T10:00:00Z",
          renewsAt: "2026-01-31T10:00:00Z", // LATER = SCHEDULED
          price: "799",
        },
      ];

      const { current, scheduled } = getActiveAndScheduledSubscriptions(subs);

      expect(current).not.toBeNull();
      expect(current?.plan.variantId).toBe(1087727);
      expect(current?.plan.productName).toBe("Yearly");

      expect(scheduled).not.toBeNull();
      expect(scheduled?.plan.variantId).toBe(1087650);
      expect(scheduled?.plan.productName).toBe("Monthly");
    });
  });

  describe("Edge Cases", () => {
    it("returns null for both when no subscriptions", () => {
      const { current, scheduled } = getActiveAndScheduledSubscriptions([]);
      expect(current).toBeNull();
      expect(scheduled).toBeNull();
    });

    it("handles subscriptions with only expired statuses", () => {
      const subs: Subscription[] = [
        createSubscription({ status: "expired" }),
        createSubscription({ status: "unpaid" }),
      ];
      const { current, scheduled } = getActiveAndScheduledSubscriptions(subs);
      expect(current).toBeNull();
      expect(scheduled).toBeNull();
    });
  });
});
