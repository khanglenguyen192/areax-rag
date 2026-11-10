import "server-only";
import { Kafka, logLevel, type Consumer, type Producer } from "kafkajs";
import { getEnv } from "@/server/config/env";
import { AppError } from "@/server/errors/app-error";
import { logger } from "@/server/http/logger";

const CLIENT_ID = "areax-application";
const SEND_TIMEOUT_MS = 10_000;

const globalState = globalThis as typeof globalThis & {
  __areaxKafka?: Kafka;
  __areaxProducer?: Promise<Producer>;
};

function kafka(): Kafka {
  globalState.__areaxKafka ??= new Kafka({
    clientId: CLIENT_ID,
    brokers: getEnv()
      .KAFKA_BOOTSTRAP_SERVERS.split(",")
      .map((broker) => broker.trim()),
    connectionTimeout: 5_000,
    requestTimeout: SEND_TIMEOUT_MS,
    retry: { retries: 3 },
    logLevel: logLevel.NOTHING,
  });
  return globalState.__areaxKafka;
}

/** The one producer, connected on first use and reused for every request. */
function producer(): Promise<Producer> {
  globalState.__areaxProducer ??= (async () => {
    const created = kafka().producer({ allowAutoTopicCreation: false });
    await created.connect();
    return created;
  })().catch((error: unknown) => {
    // Forget the failed attempt so the next request tries to connect again.
    globalState.__areaxProducer = undefined;
    throw error;
  });
  return globalState.__areaxProducer;
}

/**
 * Publishes one JSON message. The partition key keeps related messages in order (chat uses the
 * thread id).
 *
 * @throws AppError `UPSTREAM_ERROR` when Kafka cannot be reached.
 */
export async function publish(topic: string, key: string, message: unknown): Promise<void> {
  try {
    const connected = await producer();
    await connected.send({ topic, messages: [{ key, value: JSON.stringify(message) }] });
  } catch (error) {
    logger.error("Kafka publish failed", {
      topic,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new AppError("UPSTREAM_ERROR");
  }
}

export function createConsumer(groupId: string): Consumer {
  return kafka().consumer({ groupId });
}
