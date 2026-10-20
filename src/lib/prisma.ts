import "server-only";

import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton: avoids exhausting the connection pool
// across Fast Refresh reloads, which each re-evaluate this module.
const globalForPrisma = globalThis as unknown as { __themesetPrisma?: PrismaClient };

export const prisma = globalForPrisma.__themesetPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__themesetPrisma = prisma;
}
