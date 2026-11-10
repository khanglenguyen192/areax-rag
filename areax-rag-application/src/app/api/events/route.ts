import type { SseEvent } from "@/model/chat/sse-event.dto";
import { requireUser } from "@/server/auth/session";
import { AppError } from "@/server/errors/app-error";
import { errorResponse } from "@/server/http/api-response";
import { sseHub } from "@/server/sse/hub";

// Server-sent events must never be cached or statically rendered.
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;
const encoder = new TextEncoder();

const frame = (event: SseEvent) =>
  encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);

/**
 * One stream per browser tab for the whole user. Tokens of every thread the user owns arrive here.
 * Opening it requires a session, like every other route.
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error.status, error.code, requestId);
    throw error;
  }

  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const removeConnection = sseHub.add(userId, (event) => controller.enqueue(frame(event)));
      // A comment line keeps proxies and the browser from closing an idle connection.
      const heartbeat = setInterval(
        () => controller.enqueue(encoder.encode(": heartbeat\n\n")),
        HEARTBEAT_MS,
      );
      controller.enqueue(encoder.encode(": connected\n\n"));

      cleanup = () => {
        clearInterval(heartbeat);
        removeConnection();
      };
      request.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      // Tell nginx-style proxies not to buffer the stream.
      "X-Accel-Buffering": "no",
      "X-Request-Id": requestId,
    },
  });
}
