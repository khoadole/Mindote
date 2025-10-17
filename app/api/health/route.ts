import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      variables: {
        supabaseUrl: supabaseUrl
          ? `${supabaseUrl.substring(0, 20)}...`
          : "MISSING",
        supabaseKey: supabaseKey
          ? `${supabaseKey.substring(0, 20)}...`
          : "MISSING",
        databaseUrl: databaseUrl
          ? `${databaseUrl.substring(0, 30)}...`
          : "MISSING",
        directUrl: directUrl ? `${directUrl.substring(0, 30)}...` : "MISSING",
      },
      allEnvKeys: Object.keys(process.env).filter(
        (key) =>
          key.includes("SUPABASE") ||
          key.includes("DATABASE") ||
          key.includes("DIRECT")
      ),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
