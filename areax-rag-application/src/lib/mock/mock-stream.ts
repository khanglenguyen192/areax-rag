import type { EventStream } from "@/lib/sse/event-stream";
import type { SseEvent } from "@/model/chat/sse-event.dto";
import { getDb } from "./mock-db";

const TOKEN_INTERVAL_MS = 55;
const FIRST_TOKEN_DELAY_MS = 600;

type Listener = (event: SseEvent) => void;

const globalBus = globalThis as typeof globalThis & { __areaxMockListeners?: Set<Listener> };

function listeners(): Set<Listener> {
  globalBus.__areaxMockListeners ??= new Set();
  return globalBus.__areaxMockListeners;
}

function emit(event: SseEvent): void {
  listeners().forEach((listener) => listener(event));
}

/** Stands in for `EventSource('/api/events')` while there is no server. */
export function createMockEventStream(): EventStream {
  return {
    subscribe(handler) {
      listeners().add(handler);
      return () => listeners().delete(handler);
    },
    close() {
      listeners().clear();
    },
  };
}

function buildAnswer(question: string): string[] {
  const text =
    `This is a simulated answer to "${question.slice(0, 80)}". ` +
    "In the real system it is written from your project's documents and follows the language of your question. " +
    "Tokens arrive one by one so you can see the answer take shape.";
  return text.split(/(?<=\s)/);
}

/** Streams a canned answer token by token, then saves it on the assistant message. */
export function simulateAnswer(threadId: string, messageId: string, question: string): void {
  const tokens = buildAnswer(question);
  let index = 0;

  const step = () => {
    const message = getDb().messages.find((candidate) => candidate.id === messageId);
    if (!message) return;
    if (index >= tokens.length) {
      message.status = "DONE";
      emit({ type: "done", threadId, messageId });
      return;
    }
    const text = tokens[index] ?? "";
    message.content += text;
    index += 1;
    emit({ type: "token", threadId, messageId, text });
    setTimeout(step, TOKEN_INTERVAL_MS);
  };

  setTimeout(step, FIRST_TOKEN_DELAY_MS);
}
