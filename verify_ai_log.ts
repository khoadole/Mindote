import { logAIUsage } from "./lib/ai-logger";
import prisma from "./lib/prisma";

async function main() {
  console.log("Testing logAIUsage...");

  // Create a dummy user if needed, or use an existing one.
  // For safety, let's try to find an existing user first.
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log("No user found to test with.");
    return;
  }

  console.log(`Logging usage for user: ${user.id}`);

  await logAIUsage({
    userId: user.id,
    feature: "test-feature",
    model: "gpt-4o-mini",
    inputTokens: 100,
    outputTokens: 50,
  });

  // Verify it was written
  const log = await prisma.aILog.findFirst({
    where: {
      userId: user.id,
      feature: "test-feature",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (log) {
    console.log("✅ Log found:", log);
    console.log(`Cost: $${log.cost}`);
    
    // Clean up
    await prisma.aILog.delete({
      where: { id: log.id }
    });
    console.log("Test log deleted.");
  } else {
    console.error("❌ Log not found!");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
