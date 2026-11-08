"use client";

import { useEffect, useRef } from "react";
import { Alert, Spinner } from "@/components/atoms";
import { ChatInput, EmptyState, ErrorMessage } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import type { MessageDto } from "@/model/chat/chat.dto";
import { MessageItem } from "../MessageItem";
import styles from "./ConversationPanel.module.scss";

type ConversationPanelProps = {
  /** Null when no thread is selected. */
  readonly messages: readonly MessageDto[] | null;
  readonly isLoading: boolean;
  readonly isSending: boolean;
  readonly isAnswering: boolean;
  readonly hasReadyDocuments: boolean;
  readonly loadError?: string;
  readonly sendError?: string;
  readonly onRetry: () => void;
  readonly onSend: (text: string) => void;
};

export function ConversationPanel({
  messages,
  isLoading,
  isSending,
  isAnswering,
  hasReadyDocuments,
  loadError,
  sendError,
  onRetry,
  onSend,
}: ConversationPanelProps) {
  const t = useT();
  const endRef = useRef<HTMLDivElement>(null);
  const lastContentLength = messages?.at(-1)?.content.length ?? 0;

  useEffect(() => {
    // Keep the newest tokens in view while an answer streams in.
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages?.length, lastContentLength]);

  if (messages === null) return <EmptyState title={t("chat.select")} />;

  return (
    <div className={styles.root}>
      {!hasReadyDocuments && <Alert tone="warning">{t("chat.noDocuments")}</Alert>}
      <div className={styles.messages} aria-live="polite">
        {isLoading && <Spinner label={t("common.loading")} isCentered />}
        {loadError && <ErrorMessage message={loadError} onRetry={onRetry} />}
        {!isLoading && !loadError && messages.length === 0 && (
          <p className={styles.empty}>{t("chat.messages.empty")}</p>
        )}
        <ul className={styles.list}>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </ul>
        <div ref={endRef} />
      </div>
      {sendError && <ErrorMessage message={sendError} />}
      <ChatInput
        id="chat-input"
        label={t("chat.input.label")}
        placeholder={t("chat.input.placeholder")}
        sendLabel={t("chat.input.send")}
        isSending={isSending}
        disabled={isAnswering}
        onSend={onSend}
      />
    </div>
  );
}
