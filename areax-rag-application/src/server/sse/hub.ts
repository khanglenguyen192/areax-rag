import "server-only";
import type { SseEvent } from "@/model/chat/sse-event.dto";

type Send = (event: SseEvent) => void;

const globalState = globalThis as typeof globalThis & {
  __areaxSseConnections?: Map<string, Set<Send>>;
};
const connections = (globalState.__areaxSseConnections ??= new Map<string, Set<Send>>());

/**
 * Maps a user id to the open SSE connections of that user (one per browser tab).
 * It lives in memory, which assumes a single application instance.
 */
export const sseHub = {
  /** Registers a connection and returns the function that removes it. */
  add(userId: string, send: Send): () => void {
    const set = connections.get(userId) ?? new Set<Send>();
    set.add(send);
    connections.set(userId, set);
    return () => {
      set.delete(send);
      if (set.size === 0) connections.delete(userId);
    };
  },

  send(userId: string, event: SseEvent): void {
    connections.get(userId)?.forEach((send) => send(event));
  },
};
