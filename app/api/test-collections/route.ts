import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdOrNull } from "@/lib/server-auth";

export async function GET() {
  try {
    console.log("🔍 Testing collections functionality...");
    
    // Test 1: Get user ID (optional để không bị block bởi auth)
    const userId = await getUserIdOrNull();
    console.log("🔍 User ID:", userId);

    if (!userId) {
      return NextResponse.json({
        status: "info",
        message: "User not authenticated",
        data: {
          isAuthenticated: false,
          canTestCollections: false
        },
        timestamp: new Date().toISOString()
      });
    }

    // Test 2: Query collections cho user này
    const collections = await prisma.collection.findMany({
      where: {
        userId: userId
      },
      include: {
        words: true
      }
    });
    console.log("✅ Collections query successful:", collections.length);

    // Test 3: Count total collections
    const totalCollections = await prisma.collection.count();
    console.log("✅ Total collections in DB:", totalCollections);

    return NextResponse.json({
      status: "success",
      message: "Collections test completed",
      data: {
        isAuthenticated: true,
        userId: userId,
        userCollections: collections.length,
        totalCollections: totalCollections,
        collections: collections
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Collections test failed:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Collections test failed",
      error: {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        code: (error as any)?.code || "No code"
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}