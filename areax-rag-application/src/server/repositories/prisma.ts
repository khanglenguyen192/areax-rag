import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/server/config/env";
import { createPrismaClient } from "./prisma-factory";

const globalForPrisma = globalThis as typeof globalThis & { __areaxPrisma?: PrismaClient };

/** The shared client. Kept on `globalThis` so hot reload in development does not open new pools. */
export function getPrisma(): PrismaClient {
  globalForPrisma.__areaxPrisma ??= createPrismaClient(getEnv().DATABASE_URL);
  return globalForPrisma.__areaxPrisma;
}
