import { z } from "zod";

/**
 * Kafka message shapes. Keep in sync with areax-rag-service/docs/message-contract.md and the
 * pydantic models in the Python service. Field names are camelCase on the wire.
 */
const envelope = {
  schemaVersion: z.literal(1),
  requestId: z.string().min(1),
  projectId: z.string().min(1),
  occurredAt: z.string().min(1),
};

export const documentUploadedSchema = z.object({
  ...envelope,
  type: z.literal("DocumentUploaded"),
  documentId: z.string(),
  storageKey: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
});

export const youtubeSourceAddedSchema = z.object({
  ...envelope,
  type: z.literal("YoutubeSourceAdded"),
  documentId: z.string(),
  url: z.string(),
  language: z.string().optional(),
});

export const documentDeletedSchema = z.object({
  ...envelope,
  type: z.literal("DocumentDeleted"),
  documentId: z.string(),
});

export const projectDeletedSchema = z.object({
  ...envelope,
  type: z.literal("ProjectDeleted"),
});

export const chatRequestedSchema = z.object({
  ...envelope,
  type: z.literal("ChatRequested"),
  threadId: z.string(),
  messageId: z.string(),
  userId: z.string(),
  question: z.string(),
});

export const chatTokenSchema = z.object({
  ...envelope,
  type: z.literal("ChatToken"),
  threadId: z.string(),
  messageId: z.string(),
  kind: z.enum(["token", "done", "error"]),
  text: z.string().optional(),
  errorCode: z.string().optional(),
});

export type DocumentEvent =
  | z.infer<typeof documentUploadedSchema>
  | z.infer<typeof youtubeSourceAddedSchema>
  | z.infer<typeof documentDeletedSchema>
  | z.infer<typeof projectDeletedSchema>;
export type ChatRequested = z.infer<typeof chatRequestedSchema>;
export type ChatToken = z.infer<typeof chatTokenSchema>;
