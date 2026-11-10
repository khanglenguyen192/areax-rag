import "server-only";
import type { EachMessagePayload } from "kafkajs";
import type { SseEvent } from "@/model/chat/sse-event.dto";
import { logger } from "@/server/http/logger";
import { chatTokenSchema, type ChatToken } from "@/server/model/messages/messages";
import { threadRepository } from "@/server/repositories/thread-repository";
import { sseHub } from "@/server/sse/hub";
import { createConsumer, publish } from "./kafka-client";
import { TOPICS } from "./topics";

const GROUP_ID = "areax-application-chat-tokens";
const OWNER_CACHE_MS = 5 * 60 * 1000;
const RECONNECT_DELAY_MS = 15_000;

const globalState = globalThis as typeof globalThis & { __areaxTokenConsumerStarted?: boolean };

const ownerCache = new Map<string, { ownerId: string; expiresAt: number }>();

async function ownerOf(threadId: string): Promise<string | null> {
  const cached = ownerCache.get(threadId);
  if (cached && cached.expiresAt > Date.now()) return cached.ownerId;
  const ownerId = await threadRepository.findOwnerId(threadId);
  if (ownerId) ownerCache.set(threadId, { ownerId, expiresAt: Date.now() + OWNER_CACHE_MS });
  return ownerId;
}

function toSseEvent(token: ChatToken): SseEvent {
  const base = { threadId: token.threadId, messageId: token.messageId };
  if (token.kind === "token") return { type: "token", ...base, text: token.text ?? "" };
  if (token.kind === "done") return { type: "done", ...base };
  return { type: "error", ...base, code: token.errorCode ?? "INTERNAL_ERROR" };
}

async function sendToDeadLetter(raw: string, reason: string): Promise<void> {
  logger.warn("Invalid chat token message sent to the dead-letter topic", { reason });
  await publish(TOPICS.deadLetter, "chat-token", {
    source: TOPICS.chatTokens,
    reason,
    payload: raw,
  });
}

async function handleMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    // Not JSON at all: retrying cannot fix it, so it goes to the dead-letter topic.
    await sendToDeadLetter(raw, "not JSON");
    return;
  }
  const parsed = chatTokenSchema.safeParse(parsedJson);
  if (!parsed.success) {
    await sendToDeadLetter(raw, "schema");
    return;
  }

  const token = parsed.data;
  const ownerId = await ownerOf(token.threadId);
  // The thread was deleted while the answer was streaming: nobody is waiting for it.
  if (!ownerId) return;

  if (token.kind === "error") {
    await threadRepository.markMessageFailed(token.messageId, token.errorCode ?? "INTERNAL_ERROR");
  }
  sseHub.send(ownerId, toSseEvent(token));
}

async function run(): Promise<void> {
  const consumer = createConsumer(GROUP_ID);
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.chatTokens, fromBeginning: false });
  await consumer.run({ eachMessage: handleMessage });
  logger.info("Chat token consumer started", { topic: TOPICS.chatTokens });
}

/**
 * Starts the one consumer that forwards answer tokens from Kafka to the SSE hub. Called once when the
 * server starts. If Kafka is down it keeps retrying in the background instead of failing the server.
 */
export function startChatTokenConsumer(): void {
  if (globalState.__areaxTokenConsumerStarted) return;
  globalState.__areaxTokenConsumerStarted = true;

  const attempt = () => {
    run().catch((error: unknown) => {
      logger.error("Chat token consumer failed; retrying", {
        error: error instanceof Error ? error.message : String(error),
        retryInMs: RECONNECT_DELAY_MS,
      });
      setTimeout(attempt, RECONNECT_DELAY_MS);
    });
  };
  attempt();
}
