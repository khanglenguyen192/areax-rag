/**
 * Creates the accounts that may sign in. There is no sign-up screen.
 *
 *   SEED_USERNAMES="alice:her-password,bob" SEED_PASSWORD=... npm run db:seed
 *
 * - `SEED_USERNAMES`: comma-separated accounts to create (required). Write `name:password` to give
 *   one account its own password.
 * - `SEED_PASSWORD`: the password for entries without their own. When empty, a random password is
 *   generated for each such account and printed once; it is not stored anywhere else.
 * - An existing account is left unchanged unless `SEED_RESET_PASSWORD=true`.
 */
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../src/server/repositories/prisma-factory";

if (existsSync(".env")) process.loadEnvFile(".env");

const COST = Number(process.env.BCRYPT_COST ?? 12);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main(): Promise<void> {
  const accounts = requireEnv("SEED_USERNAMES")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf(":");
      return separator === -1
        ? { username: entry, ownPassword: null }
        : { username: entry.slice(0, separator), ownPassword: entry.slice(separator + 1) };
    });
  const sharedPassword = process.env.SEED_PASSWORD || null;
  const resetPassword = process.env.SEED_RESET_PASSWORD === "true";

  const prisma = createPrismaClient(requireEnv("DATABASE_URL"));
  try {
    for (const { username, ownPassword } of accounts) {
      const normalized = username.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { usernameNormalized: normalized } });
      if (existing && !resetPassword) {
        process.stdout.write(`kept     ${username} (already exists)\n`);
        continue;
      }

      const password = ownPassword ?? sharedPassword ?? randomBytes(12).toString("base64url");
      const passwordHash = await bcrypt.hash(password, COST);
      await prisma.user.upsert({
        where: { usernameNormalized: normalized },
        create: { username, usernameNormalized: normalized, passwordHash },
        update: { passwordHash },
      });
      const shown = ownPassword || sharedPassword ? "(as given)" : password;
      process.stdout.write(
        `${existing ? "reset   " : "created "} ${username}  password: ${shown}\n`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
