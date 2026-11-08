import { useContext, useEffect } from "react";
import { SseContext } from "@/components/providers/sse-context";
import type { SseEvent } from "@/model/chat/sse-event.dto";

/**
 * Calls `onEvent` for each event on the tab's single SSE stream.
 * The stream is opened once by `SseProvider`; this hook only subscribes to it.
 */
export function useSseEvents(onEvent: (event: SseEvent) => void): void {
  const context = useContext(SseContext);

  useEffect(() => {
    if (!context) return undefined;
    return context.subscribe(onEvent);
  }, [context, onEvent]);
}
