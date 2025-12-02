import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/debug-billing
 *
 * Debug endpoint to check billing status and webhook events
 */
export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    // Get recent webhook events
    const recentWebhooks = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        eventName: true,
        processed: true,
        processingError: true,
        createdAt: true,
      },
    });

    // Get plans
    const plans = await prisma.plan.findMany();

    return NextResponse.json({
      success: true,
      userId,
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        lemonSqueezyId: sub.lemonSqueezyId,
        status: sub.status,
        statusFormatted: sub.statusFormatted,
        planName: sub.plan.name,
        planVariantId: sub.plan.variantId,
        price: sub.price,
        renewsAt: sub.renewsAt,
        endsAt: sub.endsAt,
        createdAt: sub.createdAt,
      })),
      recentWebhooks,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        variantId: p.variantId,
        price: p.price,
      })),
      envCheck: {
        hasApiKey: !!process.env.LEMON_SQUEEZY_API_KEY,
        hasStoreId: !!process.env.LEMON_SQUEEZY_STORE_ID,
        hasWebhookSecret: !!process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
    });
  } catch (error: any) {
    console.error("Debug billing error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/debug-billing
 *
 * Trigger plan sync
 */
export async function POST() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { syncPlans } = await import("@/app/actions/lemonsqueezy");
    const plans = await syncPlans();

    return NextResponse.json({
      success: true,
      message: "Plans synced successfully",
      plans,
    });
  } catch (error: any) {
    console.error("Sync plans error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
