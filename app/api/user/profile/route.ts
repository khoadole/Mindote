import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";

// GET: Get current user's profile info from database
export async function GET() {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        authenticated: true,
        user: null 
      });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
