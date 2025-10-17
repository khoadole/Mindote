"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensure user exists in database
 * This handles the race condition where Supabase auth.users exists
 * but the trigger hasn't created the user in public.users yet
 *
 * @param userId - The user ID from Supabase auth
 * @returns The user object from database
 */
export async function ensureUserExists(userId: string) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (existingUser) {
    return existingUser;
  }

  // User doesn't exist, create them
  console.log(`[ensureUserExists] Creating missing user: ${userId}`);

  // Get user info from Supabase auth
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new Error("Failed to get auth user");
  }

  try {
    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: authUser.email!,
        username: authUser.user_metadata?.username || null,
        displayName:
          authUser.user_metadata?.display_name ||
          authUser.email?.split("@")[0] ||
          null,
        avatarUrl: authUser.user_metadata?.avatar_url || null,
      },
    });

    // Also create default settings
    try {
      await prisma.setting.create({
        data: {
          userId: userId,
        },
      });
    } catch (settingsError) {
      // Ignore if settings already exist (from trigger)
      console.log(
        `[ensureUserExists] Settings may already exist:`,
        settingsError
      );
    }

    console.log(`[ensureUserExists] ✅ User created successfully`);
    return newUser;
  } catch (createError: any) {
    // If there's a race condition and another request created the user, fetch it
    if (createError.code === "P2002") {
      console.log(`[ensureUserExists] Race condition detected, fetching user`);
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user) return user;
    }
    throw createError;
  }
}
