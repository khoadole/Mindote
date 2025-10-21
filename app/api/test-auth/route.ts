import { NextResponse } from "next/server";
import { getUserId, getUserIdOrNull } from "@/lib/server-auth";

// ✅ Prevent this route from being statically generated during build
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("🔍 Testing authentication...");

    // Test 1: Check if user is authenticated (strict)
    let userId = null;
    let authError = null;

    try {
      userId = await getUserId();
      console.log("✅ getUserId() success:", userId);
    } catch (error) {
      authError = error instanceof Error ? error.message : "Unknown auth error";
      console.log("❌ getUserId() failed:", authError);
    }

    // Test 2: Check if user is authenticated (optional)
    const userIdOptional = await getUserIdOrNull();
    console.log("🔍 getUserIdOrNull() result:", userIdOptional);

    return NextResponse.json({
      status: "success",
      message: "Authentication test completed",
      data: {
        userId: userId,
        userIdOptional: userIdOptional,
        isAuthenticated: !!userId,
        authError: authError,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Auth test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Authentication test failed",
        error: {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
