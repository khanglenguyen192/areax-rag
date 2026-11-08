"use client";

import { useState } from "react";
import { Spinner } from "@/components/atoms";
import { ErrorMessage } from "@/components/molecules";
import { ConversationPanel, ThreadList } from "@/components/organisms";
import { ChatLayout } from "@/components/templates";
import { useT } from "@/hooks/common/useT";
import { useThreadMessages } from "@/hooks/chat/useThreadMessages";
import { useThreads } from "@/hooks/chat/useThreads";
import { useProjectDocuments } from "@/hooks/documents/useProjectDocuments";
import { describeError } from "@/lib/describe-error";

type ProjectChatTabProps = {
  readonly projectId: string;
};

export function ProjectChatTab({ projectId }: ProjectChatTabProps) {
  const t = useT();
  const threads = useThreads(projectId);
  const documents = useProjectDocuments(projectId);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const messages = useThreadMessages(selectedThreadId);

  const handleCreate = async () => {
    const thread = await threads.create();
    if (thread) setSelectedThreadId(thread.id);
  };

  const handleDelete = async (threadId: string) => {
    await threads.remove(threadId);
    if (threadId === selectedThreadId) setSelectedThreadId(null);
  };

  if (threads.isLoading) return <Spinner label={t("common.loading")} isCentered />;
  if (!threads.data)
    return (
      <ErrorMessage message={t("chat.threads.error")} onRetry={() => void threads.refetch()} />
    );

  const hasReadyDocuments =
    documents.data?.items.some((document) => document.status === "READY") ?? true;

  return (
    <ChatLayout
      sidebar={
        <ThreadList
          threads={threads.data}
          selectedThreadId={selectedThreadId}
          isCreating={threads.isCreating}
          errorMessage={threads.actionError ? describeError(threads.actionError, t) : undefined}
          onSelect={setSelectedThreadId}
          onCreate={() => void handleCreate()}
          onDelete={handleDelete}
        />
      }
      content={
        <ConversationPanel
          messages={selectedThreadId === null ? null : (messages.data ?? [])}
          isLoading={messages.isLoading}
          isSending={messages.isSending}
          isAnswering={messages.isAnswering}
          hasReadyDocuments={hasReadyDocuments}
          loadError={messages.error !== undefined ? t("chat.messages.error") : undefined}
          sendError={messages.sendError ? describeError(messages.sendError, t) : undefined}
          onRetry={() => void messages.refetch()}
          onSend={(text) => {
            messages.resetSendError();
            void messages.send(text);
          }}
        />
      }
    />
  );
}
