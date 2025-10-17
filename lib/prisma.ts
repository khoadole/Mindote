import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ Check if we're using connection pooler (pgbouncer)
const isUsingPooler = process.env.DATABASE_URL?.includes("pgbouncer=true");

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // ✅ Disable prepared statement caching when using connection pooler in serverless
    // This prevents "prepared statement does not exist" errors in Vercel
    ...(isUsingPooler && {
      adapter: undefined,
    }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
