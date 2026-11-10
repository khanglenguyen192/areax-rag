import "server-only";
import { getEnv } from "@/server/config/env";

type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function write(level: Level, msg: string, context: Record<string, unknown>): void {
  if (ORDER[level] < ORDER[getEnv().LOG_LEVEL]) return;
  const line = JSON.stringify({ level, time: new Date().toISOString(), msg, ...context });
  (level === "error" ? process.stderr : process.stdout).write(`${line}\n`);
}

/**
 * Structured JSON logger. Never pass secrets, tokens, passwords, prompts or document contents.
 * Pass `requestId` and `userId` in the context when they are known.
 */
export const logger = {
  debug: (msg: string, context: Record<string, unknown> = {}) => write("debug", msg, context),
  info: (msg: string, context: Record<string, unknown> = {}) => write("info", msg, context),
  warn: (msg: string, context: Record<string, unknown> = {}) => write("warn", msg, context),
  error: (msg: string, context: Record<string, unknown> = {}) => write("error", msg, context),
};
