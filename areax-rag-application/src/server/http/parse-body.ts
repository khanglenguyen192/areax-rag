import "server-only";
import type { z } from "zod";
import type { ApiFieldError } from "@/model/api/api-response.dto";
import { AppError } from "@/server/errors/app-error";

const KNOWN_FIELD_CODES = new Set(["REQUIRED", "TOO_LONG"]);

function toFieldErrors(error: z.ZodError): ApiFieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join("."),
    // A missing field (or one of the wrong type) is reported as REQUIRED; the schemas put their own
    // codes (REQUIRED, TOO_LONG) in `message` for the other rules.
    code:
      issue.code === "invalid_type"
        ? "REQUIRED"
        : KNOWN_FIELD_CODES.has(issue.message)
          ? issue.message
          : "INVALID",
  }));
}

/** Reads and validates a JSON body. Malformed JSON and invalid fields both become `VALIDATION_FAILED`. */
export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    // An empty or malformed body is a client mistake, not a server fault.
    throw new AppError("VALIDATION_FAILED");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", toFieldErrors(parsed.error));
  return parsed.data;
}

/** Like `readJson`, but an absent body means "use the defaults" (for endpoints with optional input). */
export async function readOptionalJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const text = await request.text();
  const parsed = schema.safeParse(text.trim() === "" ? {} : safeJson(text));
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", toFieldErrors(parsed.error));
  return parsed.data;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Falls through to schema validation, which rejects a non-object value.
    return undefined;
  }
}
