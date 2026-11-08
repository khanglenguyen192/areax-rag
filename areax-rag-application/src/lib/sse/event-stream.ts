import type { SseEvent } from "@/model/chat/sse-event.dto";

export type EventStream = {
  /** Registers a handler for every event and returns a function that removes it. */
  readonly subscribe: (handler: (event: SseEvent) => void) => () => void;
  readonly close: () => void;
};

const SSE_URL = "/api/events";
const EVENT_TYPES = ["token", "done", "error"] as const;

function parseEvent(type: string, raw: unknown): SseEvent | null {
  if (typeof raw !== "string") return null;
  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    return { ...payload, type } as SseEvent;
  } catch {
    // A malformed frame must not break the stream; the saved answer is reloaded on the next fetch.
    return null;
  }
}

/** Opens the single per-tab stream. Uses the in-memory simulator when mock mode is on. */
export async function openEventStream(): Promise<EventStream> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    const { createMockEventStream } = await import("./../mock/mock-stream");
    return createMockEventStream();
  }

  const source = new EventSource(SSE_URL);
  const handlers = new Set<(event: SseEvent) => void>();

  for (const type of EVENT_TYPES) {
    source.addEventListener(type, (message) => {
      // The browser also fires a data-less `error` Event when the connection drops; ignore that one.
      if (!(message instanceof MessageEvent)) return;
      const event = parseEvent(type, message.data);
      if (event) handlers.forEach((handler) => handler(event));
    });
  }

  return {
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close: () => source.close(),
  };
}
