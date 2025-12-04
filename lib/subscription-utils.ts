/**
 * Subscription utility functions for identifying the active subscription.
 * 
 * Simplified logic: User has only ONE active subscription at a time.
 * When switching plans, the old plan is cancelled and the new plan becomes active.
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

/**
 * Filters subscriptions to get only those that are currently active.
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
 * Gets the active subscription from a list of subscriptions.
 * Returns the first active subscription found.
 * 
 * @example
 * const active = getActiveSubscription(subscriptions);
 */
export function getActiveSubscription(
  subscriptions: Subscription[]
): Subscription | null {
  const active = filterActiveSubscriptions(subscriptions);
  return active[0] || null;
}

