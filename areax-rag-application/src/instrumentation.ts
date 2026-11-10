/**
 * Runs once when the server starts. It starts the Kafka consumer that forwards answer tokens to
 * the SSE hub. Skipped in mock mode, where there is no Kafka.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") return;

  const { getEnv } = await import("@/server/config/env");
  getEnv();
  const { startChatTokenConsumer } = await import("@/server/kafka/chat-token-consumer");
  startChatTokenConsumer();
}
