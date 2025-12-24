import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface HealthCheck {
  name: string;
  status: "ok" | "error";
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Test database connection with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    return {
      name: "database",
      status: "ok",
      latency: Date.now() - start,
      details: { connected: true },
    };
  } catch (error) {
    return {
      name: "database",
      status: "error",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkTables(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Check if all required tables exist and are accessible
    const [
      usersCount,
      collectionsCount,
      wordsCount,
      plansCount,
      subscriptionsCount,
      settingsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.collection.count(),
      prisma.word.count(),
      prisma.plan.count(),
      prisma.subscription.count(),
      prisma.setting.count(),
    ]);

    return {
      name: "tables",
      status: "ok",
      latency: Date.now() - start,
      details: {
        users: usersCount,
        collections: collectionsCount,
        words: wordsCount,
        plans: plansCount,
        subscriptions: subscriptionsCount,
        settings: settingsCount,
      },
    };
  } catch (error) {
    return {
      name: "tables",
      status: "error",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkLemonSqueezy(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      return {
        name: "lemon_squeezy",
        status: "error",
        error: "Missing API key or Store ID",
      };
    }

    // Test API connection
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/stores/${storeId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return {
      name: "lemon_squeezy",
      status: "ok",
      latency: Date.now() - start,
      details: { connected: true },
    };
  } catch (error) {
    return {
      name: "lemon_squeezy",
      status: "error",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkOpenAI(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        name: "openai",
        status: "error",
        error: "Missing API key",
      };
    }

    // Just check if key format is valid (don't make actual API call to save costs)
    const isValidFormat = apiKey.startsWith("sk-");

    return {
      name: "openai",
      status: isValidFormat ? "ok" : "error",
      latency: Date.now() - start,
      details: { keyConfigured: true, validFormat: isValidFormat },
    };
  } catch (error) {
    return {
      name: "openai",
      status: "error",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function checkEnvironment(): HealthCheck {
  const requiredVars = [
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "LEMON_SQUEEZY_API_KEY",
    "LEMON_SQUEEZY_STORE_ID",
    "LEMON_SQUEEZY_WEBHOOK_SECRET",
    "OPENAI_API_KEY",
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);
  const configured = requiredVars.filter((v) => process.env[v]);

  return {
    name: "environment",
    status: missing.length === 0 ? "ok" : "error",
    details: {
      configured: configured.length,
      missing: missing.length > 0 ? missing : undefined,
      total: requiredVars.length,
    },
  };
}

export async function GET() {
  const startTime = Date.now();

  try {
    // Run all checks in parallel
    const [database, tables, lemonSqueezy, openai] = await Promise.all([
      checkDatabase(),
      checkTables(),
      checkLemonSqueezy(),
      checkOpenAI(),
    ]);

    const environment = checkEnvironment();

    const checks = [database, tables, lemonSqueezy, openai, environment];
    const allHealthy = checks.every((c) => c.status === "ok");
    const healthyCount = checks.filter((c) => c.status === "ok").length;

    return NextResponse.json(
      {
        status: allHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        totalLatency: Date.now() - startTime,
        summary: `${healthyCount}/${checks.length} checks passed`,
        checks,
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
