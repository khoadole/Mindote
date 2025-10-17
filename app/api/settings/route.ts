import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";

// Force dynamic rendering - prevents build-time errors
export const dynamic = 'force-dynamic';

/**
 * GET /api/settings
 * Get settings for authenticated user
 */
export async function GET() {
  try {
    const userId = await getUserId();

    let settings = await prisma.setting.findUnique({
      where: {
        userId,
      },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          userId,
          srsEnabled: false,
          ttsEnabled: false,
          theme: "dark",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings
 * Update settings for authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const { srsEnabled, ttsEnabled, theme } = body;

    const settings = await prisma.setting.upsert({
      where: {
        userId,
      },
      update: {
        ...(srsEnabled !== undefined && { srsEnabled }),
        ...(ttsEnabled !== undefined && { ttsEnabled }),
        ...(theme && { theme }),
      },
      create: {
        userId,
        srsEnabled: srsEnabled ?? false,
        ttsEnabled: ttsEnabled ?? false,
        theme: theme ?? "dark",
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
