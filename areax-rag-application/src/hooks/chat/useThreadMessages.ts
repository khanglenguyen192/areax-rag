import { useCallback } from "react";
import { useAsyncAction } from "@/hooks/common/useAsyncAction";
import { useAsyncData, type AsyncData } from "@/hooks/common/useAsyncData";
import { apiClient } from "@/lib/api-client";
import type { MessageDto, SendMessageResultDto } from "@/model/chat/chat.dto";
import type { SseEvent } from "@/model/chat/sse-event.dto";
import { useSseEvents } from "./useSseEvents";

export type ThreadMessages = AsyncData<readonly MessageDto[]> & {
  readonly send: (content: string) => Promise<true | undefined>;
  readonly isSending: boolean;
  readonly sendError: unknown;
  readonly resetSendError: () => void;
  readonly isAnswering: boolean;
};

/** Loads a thread's messages and sends questions; the answer is appended as SSE tokens arrive. */
export function useThreadMessages(threadId: string | null): ThreadMessages {
  const load = useCallback(
    (signal: AbortSignal) =>
      threadId
        ? apiClient.get<readonly MessageDto[]>(`/api/threads/${threadId}/messages`, signal)
        : Promise.resolve([]),
    [threadId],
  );
  const state = useAsyncData(load, threadId !== null);
  const { setData, refetch } = state;

  const handleEvent = useCallback(
    (event: SseEvent) => {
      if (event.threadId !== threadId) return;
      setData((previous) => {
        const known = previous?.some((message) => message.id === event.messageId);
        if (!previous || !known) {
          // The answer started before the send response arrived: reload the saved message instead.
          if (event.type === "done") void refetch();
          return previous;
        }
        return previous.map((message) => {
          if (message.id !== event.messageId) return message;
          if (event.type === "token") return { ...message, content: message.content + event.text };
          if (event.type === "done") return { ...message, status: "DONE" };
          return { ...message, status: "FAILED", failureCode: event.code };
        });
      });
    },
    [threadId, setData, refetch],
  );
  useSseEvents(handleEvent);

  const sendRequest = useCallback(
    async (content: string) => {
      if (!threadId) return undefined;
      const result = await apiClient.post<SendMessageResultDto>(
        `/api/threads/${threadId}/messages`,
        { content },
      );
      setData((previous) => [...(previous ?? []), result.userMessage, result.assistantMessage]);
      return true as const;
    },
    [threadId, setData],
  );
  const sending = useAsyncAction(sendRequest);

  const isAnswering = state.data?.some((message) => message.status === "STREAMING") ?? false;

  return {
    ...state,
    send: sending.run,
    isSending: sending.isRunning,
    sendError: sending.error,
    resetSendError: sending.reset,
    isAnswering,
  };
}
