import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/server-auth";

export async function POST() {
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
        },
        { status: 401 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (existingUser) {
      return NextResponse.json({
        status: "success",
        message: "User already exists",
        data: { user: existingUser },
      });
    }

    // 3. Create user in public.users
    const email = supabaseUser.email;
    if (!email) {
      return NextResponse.json(
        {
          status: "error",
          message: "User email is required",
        },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: email,
        username: supabaseUser.user_metadata?.username || null,
        displayName:
          supabaseUser.user_metadata?.display_name || email.split("@")[0],
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
      },
    });

    // 4. Create default settings
    const settings = await prisma.setting.create({
      data: {
        userId: supabaseUser.id,
        theme: "dark",
        language: "en",
      },
    });

    return NextResponse.json({
      status: "success",
      message: "User and settings created successfully",
      data: {
        user: newUser,
        settings: settings,
      },
    });
  } catch (error) {
    console.error("User creation failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create user",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
