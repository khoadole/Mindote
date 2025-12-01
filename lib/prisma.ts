import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Slow query threshold in milliseconds
const SLOW_QUERY_THRESHOLD = 1000;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : [
            "error",
            "warn",
            {
              emit: "event",
              level: "query",
            },
          ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Log slow queries in development
if (process.env.NODE_ENV !== "production") {
  // @ts-expect-error - Prisma event types
  prisma.$on(
    "query",
    (e: { query: string; params: string; duration: number }) => {
      if (e.duration > SLOW_QUERY_THRESHOLD) {
        console.warn("⚠️ SLOW QUERY DETECTED:");
        console.warn(`  Duration: ${e.duration}ms`);
        console.warn(`  Query: ${e.query}`);
        console.warn(`  Params: ${e.params}`);
        console.warn("---");
      }
    }
  );

  globalForPrisma.prisma = prisma;
}

export default prisma;
