import "server-only";
import type { ApiFieldError, ApiResponse } from "@/model/api/api-response.dto";

/** What a handler returns; `withApiHandler` turns it into the `ApiResponse` envelope. */
export type HandlerResult = {
  readonly status: 200 | 201 | 204;
  readonly code: "OK" | "CREATED";
  readonly data?: unknown;
};

export const ok = <T>(data: T): HandlerResult => ({ status: 200, code: "OK", data });
export const created = <T>(data: T): HandlerResult => ({ status: 201, code: "CREATED", data });
/** An empty success, for example after a delete. Sent as 204 with no body. */
export const noContent = (): HandlerResult => ({ status: 204, code: "OK" });

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

export function successResponse(result: HandlerResult, requestId: string): Response {
  const headers = { "X-Request-Id": requestId };
  if (result.status === 204) return new Response(null, { status: 204, headers });

  const body: ApiResponse = {
    status: result.status,
    code: result.code,
    message: result.code,
    requestId,
    timestamp: new Date().toISOString(),
    ...(result.data === undefined ? {} : { data: result.data }),
  };
  return Response.json(body, { status: result.status, headers });
}

export function errorResponse(
  status: number,
  code: string,
  requestId: string,
  errors: readonly ApiFieldError[] = [],
): Response {
  const body: ApiResponse = {
    status,
    code,
    // For debugging only; the UI shows text from the locale file, never this.
    message: code,
    requestId,
    timestamp: new Date().toISOString(),
    ...(errors.length > 0 ? { errors } : {}),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, "X-Request-Id": requestId },
  });
}
