import type { ApiResponse } from "@/model/api/api-response.dto";
import { handleAuth } from "./routes/auth-routes";
import { handleChat } from "./routes/chat-routes";
import { handleDocuments } from "./routes/document-routes";
import { handleProjects } from "./routes/project-routes";
import type { MockContext, MockHandler } from "./routes/mock-context";
import { mockFail } from "./mock-response";

const LATENCY_MS = 180;

const HANDLERS: readonly MockHandler[] = [handleAuth, handleProjects, handleDocuments, handleChat];

/**
 * Answers an API call from in-memory data, using the same envelope the real server returns.
 * Resolution is delayed a little so loading states are visible during development.
 */
export async function handleMockRequest(
  method: string,
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<ApiResponse> {
  await new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const context: MockContext = { method, path: path.split("?")[0] ?? path, body };
  for (const handler of HANDLERS) {
    const response = handler(context);
    if (response) return response;
  }
  return mockFail(404, "NOT_FOUND");
}
