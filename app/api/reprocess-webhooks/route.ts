import { NextResponse } from "next/server";
import { processWebhookEvent } from "@/app/actions/lemonsqueezy";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/reprocess-webhooks
 *
 * Reprocess failed webhook events after plans have been synced
 */
export async function POST() {
  try {
    // Get failed webhook events (subscription events that had plan not found error)
    const failedWebhooks = await prisma.webhookEvent.findMany({
      where: {
        processed: true,
        processingError: {
          not: null,
        },
        eventName: {
          startsWith: "subscription_",
        },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      `🔄 Found ${failedWebhooks.length} failed webhooks to reprocess`
    );

    const results = [];

    for (const webhook of failedWebhooks) {
      try {
        // Reset the webhook to unprocessed state
        await prisma.webhookEvent.update({
          where: { id: webhook.id },
          data: {
            processed: false,
            processingError: null,
          },
        });

        // Reprocess the webhook
        await processWebhookEvent(webhook.id);

        // Check if it succeeded
        const updated = await prisma.webhookEvent.findUnique({
          where: { id: webhook.id },
        });

        results.push({
          id: webhook.id,
          eventName: webhook.eventName,
          success: !updated?.processingError,
          error: updated?.processingError,
        });

        console.log(
          updated?.processingError
            ? `❌ Failed to reprocess ${webhook.id}: ${updated.processingError}`
            : `✅ Successfully reprocessed ${webhook.id}`
        );
      } catch (error: any) {
        results.push({
          id: webhook.id,
          eventName: webhook.eventName,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Reprocessed ${failedWebhooks.length} webhooks. ${successCount} succeeded.`,
      results,
    });
  } catch (error: any) {
    console.error("❌ Error reprocessing webhooks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reprocess webhooks" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reprocess-webhooks
 *
 * Get failed webhooks info
 */
export async function GET() {
  try {
    const failedWebhooks = await prisma.webhookEvent.findMany({
      where: {
        processingError: {
          not: null,
        },
      },
      select: {
        id: true,
        eventName: true,
        processingError: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Reprocess Webhooks Endpoint",
      failedWebhooks,
      usage: "Send a POST request to reprocess failed webhook events",
      note: "Make sure to run /api/sync-plans first to sync plans from Lemon Squeezy",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get failed webhooks" },
      { status: 500 }
    );
  }
}
