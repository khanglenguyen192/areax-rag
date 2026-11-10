import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Builds a Prisma client. It lives apart from `prisma.ts` (which is server-only) so the seed
 * script, which runs outside Next.js, can use it too.
 */
export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
