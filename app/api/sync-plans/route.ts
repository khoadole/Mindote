import { NextResponse } from "next/server";
import { syncPlans } from "@/app/actions/lemonsqueezy";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * curl -X POST http://localhost:3000/api/sync-plans
 * POST /api/sync-plans
 *
 * Sync plans from Lemon Squeezy to database
 * This should be run once after setting up Lemon Squeezy
 */
export async function POST() {
  try {
    console.log("🔄 Starting plan sync from Lemon Squeezy...");
    await syncPlans();

    // Get updated plans
    const plans = await prisma.plan.findMany();
    console.log(`✅ Plan sync completed. ${plans.length} plans synced.`);

    return NextResponse.json({
      success: true,
      message: "Plans synced successfully",
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        variantId: p.variantId,
        price: p.price,
        interval: p.interval,
      })),
    });
  } catch (error: any) {
    console.error("❌ Error syncing plans:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync plans" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync-plans
 *
 * Get current plans and sync instructions
 */
export async function GET() {
  try {
    const plans = await prisma.plan.findMany();

    return NextResponse.json({
      message: "Sync Plans Endpoint",
      currentPlans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        variantId: p.variantId,
        price: p.price,
      })),
      usage: "Send a POST request to sync plans from Lemon Squeezy",
      instructions: [
        "1. Make sure LEMON_SQUEEZY_API_KEY is set in your .env",
        "2. Make sure LEMON_SQUEEZY_STORE_ID is set in your .env",
        "3. Send a POST request to /api/sync-plans",
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get plans" },
      { status: 500 }
    );
  }
}
