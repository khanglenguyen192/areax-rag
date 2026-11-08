"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { openEventStream, type EventStream } from "@/lib/sse/event-stream";
import type { SseEvent } from "@/model/chat/sse-event.dto";
import { SseContext, type SseContextValue } from "../sse-context";

type SseProviderProps = {
  readonly children: ReactNode;
};

type Handler = (event: SseEvent) => void;

/** Opens the tab's single SSE stream and fans events out to subscribers. */
export function SseProvider({ children }: SseProviderProps) {
  const handlersRef = useRef(new Set<Handler>());

  useEffect(() => {
    let stream: EventStream | null = null;
    let unsubscribe: (() => void) | null = null;
    let isCancelled = false;

    void openEventStream().then((opened) => {
      if (isCancelled) {
        opened.close();
        return;
      }
      stream = opened;
      unsubscribe = opened.subscribe((event) =>
        handlersRef.current.forEach((handler) => handler(event)),
      );
    });

    return () => {
      isCancelled = true;
      unsubscribe?.();
      stream?.close();
    };
  }, []);

  const value = useMemo<SseContextValue>(
    () => ({
      subscribe(handler) {
        handlersRef.current.add(handler);
        return () => handlersRef.current.delete(handler);
      },
    }),
    [],
  );

  return <SseContext.Provider value={value}>{children}</SseContext.Provider>;
}
