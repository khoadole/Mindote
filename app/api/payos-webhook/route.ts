import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature, PayOSWebhookPayload } from "@/lib/payos";
import { activatePayOSSubscription } from "@/app/actions/payos";
import {
  storeWebhookEvent,
  updateWebhookEventProcessed,
} from "@/app/actions/lemonsqueezy";

export const dynamic = "force-dynamic";

/**
 * POST /api/payos-webhook
 *
 * Receives and processes PayOS payment webhooks.
 * Register this URL in the PayOS merchant dashboard under Cài đặt → Webhook.
 *
 * Security: signature is verified with HMAC-SHA256 (PAYOS_CHECKSUM_KEY)
 * before any business logic executes.
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.PAYOS_CHECKSUM_KEY) {
      console.error("❌ [PayOS] PAYOS_CHECKSUM_KEY not set");
      return new Response("PayOS not configured", { status: 500 });
    }

    const raw = await request.text();

    let payload: PayOSWebhookPayload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // ── Signature verification ───────────────────────────────────────────────
    if (!verifyWebhookSignature(payload)) {
      console.error("❌ [PayOS] Invalid signature", {
        orderCode: payload?.data?.orderCode,
      });
      return new Response("Invalid signature", { status: 401 });
    }

    const orderCode = payload.data?.orderCode?.toString();
    const eventName = payload.success ? "payos_payment_paid" : "payos_payment_cancelled";

    console.log(`✅ [PayOS] Verified: ${eventName}, orderCode=${orderCode}`);

    // ── Store for audit trail (reuses existing WebhookEvent table) ───────────
    const webhookEventId = await storeWebhookEvent(eventName, payload);

    // ── Process asynchronously — return 200 immediately ──────────────────────
    if (payload.success && orderCode) {
      handlePaidPayment(orderCode, payload, webhookEventId).catch((err) =>
        console.error("❌ [PayOS] handlePaidPayment error:", err)
      );
    } else if (orderCode) {
      handleCancelledPayment(orderCode, webhookEventId).catch((err) =>
        console.error("❌ [PayOS] handleCancelledPayment error:", err)
      );
    }

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("❌ [PayOS] Webhook error:", err);
    return new Response(`Webhook error: ${err.message}`, { status: 500 });
  }
}

// ─── Background processors ────────────────────────────────────────────────────

async function handlePaidPayment(
  orderCode: string,
  payload: PayOSWebhookPayload,
  webhookEventId: string
) {
  try {
    await activatePayOSSubscription(
      orderCode,
      payload as unknown as Record<string, unknown>
    );
    await updateWebhookEventProcessed(webhookEventId, null);
    console.log(`✅ [PayOS] Subscription activated: orderCode=${orderCode}`);
  } catch (err: any) {
    await updateWebhookEventProcessed(webhookEventId, err.message);
    throw err;
  }
}

async function handleCancelledPayment(orderCode: string, webhookEventId: string) {
  try {
    await prisma.payOSOrder.updateMany({
      where: { orderCode, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    await updateWebhookEventProcessed(webhookEventId, null);
    console.log(`[PayOS] Order cancelled: orderCode=${orderCode}`);
  } catch (err: any) {
    await updateWebhookEventProcessed(webhookEventId, err.message);
    throw err;
  }
}

/**
 * GET /api/payos-webhook
 * Returns setup instructions for the PayOS dashboard.
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mindote.app";
  return NextResponse.json({
    message: "PayOS Webhook Endpoint",
    status: "active",
    webhookUrl: `${appUrl}/api/payos-webhook`,
    instructions: [
      "1. Truy cập PayOS Dashboard → Cài đặt → Webhook",
      `2. Nhập URL: ${appUrl}/api/payos-webhook`,
      "3. Đảm bảo PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY đã được cấu hình trong .env",
    ],
  });
}
