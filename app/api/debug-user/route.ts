import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/server-auth";

export async function GET() {
  try {
    // 1. Get current Supabase user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return NextResponse.json(
        {
          status: "error",
          message: "Not authenticated",
          error: error?.message,
        },
        { status: 401 }
      );
    }

    // 2. Check if user exists in public.users
    const publicUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      include: {
        collections: {
          include: {
            _count: {
              select: { words: true },
            },
          },
        },
        setting: true,
      },
    });

    // 3. Get all auth users vs public users count
    const publicUsersCount = await prisma.user.count();

    return NextResponse.json({
      status: "success",
      data: {
        supabaseUser: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          created_at: supabaseUser.created_at,
          user_metadata: supabaseUser.user_metadata,
        },
        publicUser: publicUser
          ? {
              id: publicUser.id,
              email: publicUser.email,
              username: publicUser.username,
              displayName: publicUser.displayName,
              collectionsCount: publicUser.collections.length,
              hasSetting: !!publicUser.setting,
            }
          : null,
        stats: {
          publicUsersCount: publicUsersCount,
          userExistsInPublic: !!publicUser,
          needsUserCreation: !publicUser,
        },
      },
    });
  } catch (error) {
    console.error("User sync check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check user sync",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
