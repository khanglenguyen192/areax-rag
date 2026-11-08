"use client";

import { useT, type TranslationKey } from "@/hooks/common/useT";
import type { MessageDto } from "@/model/chat/chat.dto";
import styles from "./MessageItem.module.scss";

type MessageItemProps = {
  readonly message: MessageDto;
};

export function MessageItem({ message }: MessageItemProps) {
  const t = useT();
  const isUser = message.role === "USER";
  const isStreaming = message.status === "STREAMING";
  const failure =
    message.status === "FAILED"
      ? t(`error.${message.failureCode ?? "UNKNOWN"}` as TranslationKey)
      : null;

  return (
    <li className={isUser ? styles.user : styles.assistant}>
      <span className={styles.author}>
        {t(isUser ? "chat.messages.you" : "chat.messages.assistant")}
      </span>
      <p className={styles.content}>
        {message.content}
        {isStreaming && message.content === "" && (
          <span className={styles.pending}>{t("chat.messages.streaming")}</span>
        )}
        {isStreaming && message.content !== "" && (
          <span className={styles.caret} aria-hidden="true" />
        )}
      </p>
      {failure && (
        <p className={styles.failure} role="alert">
          {failure}
        </p>
      )}
    </li>
  );
}
