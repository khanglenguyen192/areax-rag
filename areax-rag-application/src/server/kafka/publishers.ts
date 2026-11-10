import "server-only";
import type { ChatRequested, DocumentEvent } from "@/server/model/messages/messages";
import { publish } from "./kafka-client";
import { TOPICS } from "./topics";

type Envelope = {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly projectId: string;
  readonly occurredAt: string;
};

const envelope = (requestId: string, projectId: string): Envelope => ({
  schemaVersion: 1,
  requestId,
  projectId,
  occurredAt: new Date().toISOString(),
});

type DocumentEventBody<T extends DocumentEvent["type"]> = Omit<
  Extract<DocumentEvent, { type: T }>,
  keyof Envelope | "type"
>;

export const publishers = {
  /** Document events use the document id as the key so events of one document stay in order. */
  documentUploaded: (
    requestId: string,
    projectId: string,
    body: DocumentEventBody<"DocumentUploaded">,
  ) =>
    publish(TOPICS.documentEvents, body.documentId, {
      ...envelope(requestId, projectId),
      type: "DocumentUploaded",
      ...body,
    }),

  youtubeSourceAdded: (
    requestId: string,
    projectId: string,
    body: DocumentEventBody<"YoutubeSourceAdded">,
  ) =>
    publish(TOPICS.documentEvents, body.documentId, {
      ...envelope(requestId, projectId),
      type: "YoutubeSourceAdded",
      ...body,
    }),

  documentDeleted: (
    requestId: string,
    projectId: string,
    body: DocumentEventBody<"DocumentDeleted">,
  ) =>
    publish(TOPICS.documentEvents, body.documentId, {
      ...envelope(requestId, projectId),
      type: "DocumentDeleted",
      ...body,
    }),

  projectDeleted: (requestId: string, projectId: string) =>
    publish(TOPICS.documentEvents, projectId, {
      ...envelope(requestId, projectId),
      type: "ProjectDeleted",
    }),

  /** Chat requests are keyed by thread so a thread's tokens come back in order. */
  chatRequested: (
    requestId: string,
    projectId: string,
    body: Omit<ChatRequested, keyof Envelope | "type">,
  ) =>
    publish(TOPICS.chatRequests, body.threadId, {
      ...envelope(requestId, projectId),
      type: "ChatRequested",
      ...body,
    }),
};
