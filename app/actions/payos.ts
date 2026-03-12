"use server";

import { addMonths, addYears } from "date-fns";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import {
  PAYOS_PLANS,
  PayOSPlanType,
  assertPayOSConfig,
  createPaymentLink,
  generateOrderCode,
} from "@/lib/payos";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mindote.app";

// ─── Create payment ───────────────────────────────────────────────────────────

/**
 * Creates a PayOS payment link for the given plan type.
 * Persists a PayOSOrder record (status: PENDING) before calling PayOS API,
 * so the order is always traceable even in the event of a partial failure.
 */
export async function createPayOSPayment(
  planType: PayOSPlanType
): Promise<{ checkoutUrl: string }> {
  assertPayOSConfig();

  const userId = await getUserId();
  const plan = PAYOS_PLANS[planType];

  // Get user info for PayOS buyer fields
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, displayName: true, username: true },
  });

  if (!user) throw new Error("User not found.");

  // Cancel any stale PENDING orders for this user+planType to keep DB clean
  await prisma.payOSOrder.updateMany({
    where: { userId, planType, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  // Generate unique orderCode and persist the intent before calling PayOS
  const orderCode = generateOrderCode();

  const order = await prisma.payOSOrder.create({
    data: {
      orderCode: orderCode.toString(),
      userId,
      planType,
      amount: plan.amount,
      status: "PENDING",
    },
  });

  try {
    const payosResponse = await createPaymentLink({
      orderCode,
      amount: plan.amount,
      description: plan.description,
      returnUrl: `${APP_URL}/billing?checkout=success&provider=payos`,
      cancelUrl: `${APP_URL}/billing?checkout=cancelled&provider=payos`,
      buyerName: user.displayName || user.username || undefined,
      buyerEmail: user.email,
    });

    // Update order with PayOS-assigned IDs for traceability
    await prisma.payOSOrder.update({
      where: { id: order.id },
      data: {
        paymentLinkId: payosResponse.paymentLinkId,
        checkoutUrl: payosResponse.checkoutUrl,
      },
    });

    return { checkoutUrl: payosResponse.checkoutUrl };
  } catch (err) {
    // Mark order failed so it doesn't sit as PENDING forever
    await prisma.payOSOrder.update({
      where: { id: order.id },
      data: { status: "EXPIRED", processingError: (err as Error).message },
    });
    throw err;
  }
}

// ─── Activate subscription (called from webhook handler) ──────────────────────

/**
 * Activates (or extends) a PayOS subscription after a successful payment.
 * Idempotent: safe to call multiple times for the same orderCode.
 *
 * Renewal logic:
 * - If the user has an existing active PayOS subscription that hasn't expired yet,
 *   extend from endsAt (user doesn't lose remaining time).
 * - Otherwise, start from now.
 */
export async function activatePayOSSubscription(
  orderCode: string,
  webhookData: Record<string, unknown>
): Promise<void> {
  const order = await prisma.payOSOrder.findUnique({
    where: { orderCode },
    include: { user: { select: { id: true, email: true, displayName: true, username: true } } },
  });

  if (!order) {
    throw new Error(`PayOS order not found: orderCode=${orderCode}`);
  }

  // Idempotency – already processed
  if (order.status === "PAID") {
    console.log(`[PayOS] Order ${orderCode} already processed, skipping.`);
    return;
  }

  const planType = order.planType as PayOSPlanType;
  const planMeta = PAYOS_PLANS[planType];

  // Find the Plan row seeded in the migration
  const plan = await prisma.plan.findFirst({
    where: { variantId: planMeta.variantId },
  });

  if (!plan) {
    throw new Error(
      `PayOS plan not found in DB for variantId=${planMeta.variantId}. ` +
        "Run the migration to seed PayOS plan entries."
    );
  }

  const now = new Date();

  // Check for an existing active PayOS subscription to extend from
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: order.userId,
      provider: "payos",
      status: "active",
    },
  });

  const baseDate =
    existing?.endsAt && new Date(existing.endsAt) > now
      ? new Date(existing.endsAt) // still valid → extend from current end
      : now;                       // expired or none → start fresh

  const endsAt =
    planType === "monthly" ? addMonths(baseDate, 1) : addYears(baseDate, 1);

  const subData = {
    provider: "payos",
    payosOrderCode: orderCode,
    userId: order.userId,
    planId: plan.id,
    name: order.user.displayName || order.user.username || order.user.email,
    email: order.user.email,
    status: "active",
    statusFormatted: "Active",
    startsAt: now.toISOString(),
    renewsAt: null,             // PayOS has no auto-renewal
    endsAt: endsAt.toISOString(),
    trialEndsAt: null,
    price: order.amount.toString(),
    isUsageBased: false,
    isPaused: false,
    lemonSqueezyId: null,
    orderId: null,
  };

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        ...subData,
        payosOrderCode: orderCode, // update to reflect latest order
        endsAt: endsAt.toISOString(),
        startsAt: now.toISOString(),
      },
    });
    console.log(
      `[PayOS] Renewed subscription for user ${order.userId}, new endsAt: ${endsAt.toISOString()}`
    );
  } else {
    await prisma.subscription.create({ data: subData });
    console.log(
      `[PayOS] Created subscription for user ${order.userId}, endsAt: ${endsAt.toISOString()}`
    );
  }

  // Mark order PAID and save raw webhook data for audit
  await prisma.payOSOrder.update({
    where: { orderCode },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { status: "PAID", webhookData: webhookData as any },
  });

  revalidatePath("/billing");
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * Returns the current user's PayOS orders (most recent first).
 * Used for admin debugging; not exposed in the main UI.
 */
export async function getUserPayOSOrders() {
  const userId = await getUserId();

  return prisma.payOSOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
