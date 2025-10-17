import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    console.log("🔍 Testing database connection...");

    // Test cơ bản nhất: ping database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database ping successful:", result);

    // Test đếm users
    const userCount = await prisma.user.count();
    console.log("✅ User count:", userCount);

    return NextResponse.json({
      status: "success",
      message: "Database connection working",
      data: {
        ping: result,
        userCount: userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          code: (error as any)?.code || "No code",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
