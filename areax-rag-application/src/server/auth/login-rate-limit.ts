import "server-only";
import { AppError } from "@/server/errors/app-error";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type Entry = { count: number; resetAt: number };

const globalState = globalThis as typeof globalThis & { __areaxLoginAttempts?: Map<string, Entry> };
const attempts = (globalState.__areaxLoginAttempts ??= new Map<string, Entry>());

/**
 * Counts failed logins per client address and username and blocks after too many.
 * In memory, which matches the single application instance this design assumes.
 */
export const loginRateLimit = {
  assertAllowed(key: string): void {
    const entry = attempts.get(key);
    if (entry && entry.resetAt > Date.now() && entry.count >= MAX_ATTEMPTS) {
      throw new AppError("RATE_LIMITED");
    }
  },

  recordFailure(key: string): void {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }
    entry.count += 1;
  },

  clear(key: string): void {
    attempts.delete(key);
  },
};
