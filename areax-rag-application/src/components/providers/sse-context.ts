import { createContext } from "react";
import type { SseEvent } from "@/model/chat/sse-event.dto";

export type SseContextValue = {
  /** Registers a handler for stream events and returns a function that removes it. */
  readonly subscribe: (handler: (event: SseEvent) => void) => () => void;
};

export const SseContext = createContext<SseContextValue | null>(null);
