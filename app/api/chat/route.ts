import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { hasActiveSubscription } from "@/app/actions/lemonsqueezy";

const FREE_DAILY_LIMIT = 5;

export async function GET() {
  try {
    const userId = await getUserId();

    const isPremium = await hasActiveSubscription();

    if (isPremium) {
      return NextResponse.json({ isPremium: true, count: 0, remainingUses: -1 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await prisma.chatUsage.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const count = usage?.count ?? 0;
    const remainingUses = Math.max(0, FREE_DAILY_LIMIT - count);

    return NextResponse.json({ isPremium: false, count, remainingUses });
  } catch {
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
