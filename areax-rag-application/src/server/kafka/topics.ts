/** Topic names. Provisional: keep in sync with areax-rag-infra/compose/kafka/topics.txt. */
export const TOPICS = {
  documentEvents: "areax.document.events",
  chatRequests: "areax.chat.requests",
  chatTokens: "areax.chat.tokens",
  deadLetter: "areax.dlq",
} as const;
