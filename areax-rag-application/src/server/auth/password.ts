import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getEnv } from "@/server/config/env";

let dummyHash: Promise<string> | undefined;

// A real bcrypt hash of a random value, built on first use. It is compared when the username does
// not exist, so an unknown username takes as long as a wrong password and the two cannot be told
// apart by timing.
function getDummyHash(): Promise<string> {
  dummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), getEnv().BCRYPT_COST);
  return dummyHash;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, getEnv().BCRYPT_COST);
}

/** Compares a password with a stored hash; pass `null` for an unknown user to keep timing equal. */
export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  const matches = await bcrypt.compare(plain, hash ?? (await getDummyHash()));
  return hash !== null && matches;
}
