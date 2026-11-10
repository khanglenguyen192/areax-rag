import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),
  KAFKA_BOOTSTRAP_SERVERS: z.string().min(1),
  AWS_ENDPOINT_URL: z.string().url(),
  // Address the BROWSER uses for presigned URLs. Differs from AWS_ENDPOINT_URL when the server
  // reaches Floci on one address and the browser reaches it on another (for example the tunnel).
  S3_PUBLIC_ENDPOINT: z.string().url().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  PROJECT_MAX_TOTAL_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(100 * 1024 * 1024),
  FILE_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(50 * 1024 * 1024),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Returns the validated environment, parsing it on first use.
 *
 * Parsing is lazy so `next build` can import route modules without a full environment; the first
 * request (or `instrumentation.ts` at start) fails fast with the list of missing variables.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(`Invalid environment: ${problems.join("; ")}`);
  }
  cached = parsed.data;
  return cached;
}
