import prisma from "@/lib/prisma";

// Pricing for gpt-4o-mini (as of late 2024/early 2025)
// Input: $0.15 per 1M tokens
// Output: $0.60 per 1M tokens
const PRICING = {
  "gpt-4o-mini": {
    input: 0.15 / 1_000_000,
    output: 0.60 / 1_000_000,
  },
  // Fallback or other models can be added here
  default: {
    input: 0.50 / 1_000_000, // Conservative estimate
    output: 1.50 / 1_000_000,
  },
};

interface LogAIUsageParams {
  userId: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export async function logAIUsage({
  userId,
  feature,
  model,
  inputTokens,
  outputTokens,
}: LogAIUsageParams) {
  try {
    const modelPricing =
      PRICING[model as keyof typeof PRICING] || PRICING.default;

    const cost =
      inputTokens * modelPricing.input + outputTokens * modelPricing.output;

    await prisma.aILog.upsert({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
      update: {
        model, // Cập nhật model mới nhất
        inputTokens: { increment: inputTokens },
        outputTokens: { increment: outputTokens },
        totalTokens: { increment: inputTokens + outputTokens },
        cost: { increment: cost },
      },
      create: {
        userId,
        feature,
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost,
      },
    });
  } catch (error) {
    console.error("Failed to log AI usage:", error);
    // Don't throw error to avoid failing the main request just because logging failed
  }
}
