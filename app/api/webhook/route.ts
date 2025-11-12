import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  processWebhookEvent,
  storeWebhookEvent,
} from "@/app/actions/lemonsqueezy";
import { webhookHasMeta } from "@/lib/typeguards";

// Force dynamic rendering for webhooks
export const dynamic = "force-dynamic";

/**
 * POST /api/webhook
 *
 * Webhook endpoint for Lemon Squeezy events.
 * This endpoint receives webhooks from Lemon Squeezy and processes them.
 *
 * Important: Set this URL in your Lemon Squeezy webhook settings:
 * https://mindote.app/api/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Check if webhook secret is configured
    if (!process.env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
      console.error("❌ LEMON_SQUEEZY_WEBHOOK_SECRET not set in .env");
      return new Response("Lemon Squeezy Webhook Secret not configured", {
        status: 500,
      });
    }

    // Get the raw body as text
    const rawBody = await request.text();

    // Get the signature from headers
    const signature = request.headers.get("X-Signature");

    if (!signature) {
      console.error("❌ Missing X-Signature header");
      return new Response("Missing signature", { status: 401 });
    }

    // Verify the webhook signature
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    // Use timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      console.error("❌ Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    console.log("✅ Webhook signature verified");

    // Parse the webhook data
    const data = JSON.parse(rawBody) as unknown;

    // Validate webhook data structure
    if (!webhookHasMeta(data)) {
      console.error("❌ Invalid webhook data structure");
      return new Response("Invalid data structure", { status: 400 });
    }

    console.log(`📥 Webhook received: ${data.meta.event_name}`);

    // Store the webhook event in the database
    const webhookEventId = await storeWebhookEvent(data.meta.event_name, data);

    console.log(`💾 Webhook event stored with ID: ${webhookEventId}`);

    // Process the webhook event asynchronously (non-blocking)
    // This allows us to return 200 immediately to Lemon Squeezy
    processWebhookEvent(webhookEventId).catch((error) => {
      console.error("❌ Error processing webhook event:", error);
    });

    // Return 200 OK immediately
    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return new Response(`Webhook error: ${error.message}`, { status: 500 });
  }
}

/**
 * GET /api/webhook
 *
 * Return info about the webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: "Lemon Squeezy Webhook Endpoint",
    status: "active",
    url: "https://mindote.app/api/webhook",
    instructions: [
      "1. Go to Lemon Squeezy Dashboard → Settings → Webhooks",
      "2. Create a new webhook with URL: https://mindote.app/api/webhook",
      "3. Select events: subscription_created, subscription_updated, subscription_cancelled",
      "4. Set a signing secret in Lemon Squeezy",
      "5. Add the signing secret to .env as LEMON_SQUEEZY_WEBHOOK_SECRET",
    ],
    requiredEvents: [
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_resumed",
      "subscription_expired",
      "subscription_paused",
      "subscription_unpaused",
    ],
  });
}
