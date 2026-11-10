import "server-only";
import { requireUser, type AuthenticatedUser } from "@/server/auth/session";
import { AppError } from "@/server/errors/app-error";
import { errorResponse, successResponse, type HandlerResult } from "./api-response";
import { logger } from "./logger";

type RouteContext<P> = { readonly params: Promise<P> };

type HandlerInput<P, U> = {
  readonly request: Request;
  readonly params: P;
  readonly requestId: string;
  readonly user: U;
};

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,64}$/;

function resolveRequestId(request: Request): string {
  const incoming = request.headers.get("x-request-id");
  return incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID();
}

async function run<P, U>(
  request: Request,
  context: RouteContext<P>,
  needsUser: boolean,
  handler: (input: HandlerInput<P, U>) => Promise<HandlerResult>,
): Promise<Response> {
  const requestId = resolveRequestId(request);
  const started = Date.now();
  const path = new URL(request.url).pathname;
  let status = 500;
  let userId: string | undefined;

  try {
    const params = await context.params;
    const user = needsUser ? await requireUser() : null;
    userId = user?.id;
    const result = await handler({ request, params, requestId, user: user as U });
    status = result.status;
    return successResponse(result, requestId);
  } catch (error) {
    if (error instanceof AppError) {
      status = error.status;
      return errorResponse(error.status, error.code, requestId, error.fieldErrors);
    }
    logger.error("Unhandled error", {
      requestId,
      userId,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error),
    });
    return errorResponse(500, "INTERNAL_ERROR", requestId);
  } finally {
    logger.info("request", {
      requestId,
      userId,
      method: request.method,
      path,
      status,
      durationMs: Date.now() - started,
    });
  }
}

/**
 * Wraps a route handler that needs a signed-in user: reads or creates the `requestId`, loads the
 * user from Postgres, converts thrown errors to the `ApiResponse` envelope and logs one line.
 */
export function withApiHandler<P = Record<string, never>>(
  handler: (input: HandlerInput<P, AuthenticatedUser>) => Promise<HandlerResult>,
) {
  return (request: Request, context: RouteContext<P>) => run(request, context, true, handler);
}

/** Same wrapper for the few routes that work without a session (login). */
export function withPublicApiHandler<P = Record<string, never>>(
  handler: (input: HandlerInput<P, null>) => Promise<HandlerResult>,
) {
  return (request: Request, context: RouteContext<P>) => run(request, context, false, handler);
}
