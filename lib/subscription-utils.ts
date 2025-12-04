/**
 * Subscription utility functions for sorting and identifying current vs scheduled subscriptions.
 * 
 * LemonSqueezy returns multiple subscriptions with status: "active" when users switch plans.
 * We distinguish between current and scheduled subscriptions by sorting by renewal date:
 * - Current: earliest renewsAt/endsAt date
 * - Scheduled: later renewsAt date (starts after current ends)
 */

export interface Subscription {
  id: string;
  status: string;
  plan: {
    variantId: number;
    productName?: string;
    interval?: string;
  };
  renewsAt?: string;
  endsAt?: string;
  startsAt?: string;
  price?: string;
  lemonSqueezyId?: string;
  isPaused?: boolean;
  statusFormatted?: string;
  trialEndsAt?: string;
}

export interface SubscriptionResult {
  current: Subscription | null;
  scheduled: Subscription | null;
}

/**
 * Filters subscriptions to get only those that are currently active or will be active.
 * Includes:
 * - status === 'active'
 * - status === 'on_trial'
 * - status === 'cancelled' but not yet expired (endsAt > now)
 */
export function filterActiveSubscriptions(subscriptions: Subscription[]): Subscription[] {
  const now = new Date();
  return subscriptions.filter((sub) => {
    if (sub.status === "active" || sub.status === "on_trial") {
      return true;
    }
    // Include cancelled subscriptions that haven't expired yet
    if (sub.status === "cancelled" && sub.endsAt) {
      return new Date(sub.endsAt) > now;
    }
    return false;
  });
}

/**
 * Sorts subscriptions by renewal/end date (earliest first).
 * Uses renewsAt, falls back to endsAt, then startsAt.
 */
export function sortSubscriptionsByRenewalDate(
  subscriptions: Subscription[]
): Subscription[] {
  return [...subscriptions].sort((a, b) => {
    const dateA = new Date(a.renewsAt || a.endsAt || a.startsAt || 0);
    const dateB = new Date(b.renewsAt || b.endsAt || b.startsAt || 0);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Gets the current and scheduled subscriptions from a list of subscriptions.
 * 
 * - Current: The subscription with the earliest renewal/end date
 * - Scheduled: The subscription with a later renewal date (if exists)
 * 
 * @example
 * // User has Monthly (renews Jan 31) and Yearly (renews Jan 2026)
 * // Monthly is "current", Yearly is "scheduled"
 * const { current, scheduled } = getActiveAndScheduledSubscriptions(subscriptions);
 */
export function getActiveAndScheduledSubscriptions(
  subscriptions: Subscription[]
): SubscriptionResult {
  const active = filterActiveSubscriptions(subscriptions);
  const sorted = sortSubscriptionsByRenewalDate(active);
  
  return {
    current: sorted[0] || null,
    scheduled: sorted[1] || null,
  };
}
