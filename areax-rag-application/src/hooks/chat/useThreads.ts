import { useCallback } from "react";
import { useAsyncAction } from "@/hooks/common/useAsyncAction";
import { useAsyncData, type AsyncData } from "@/hooks/common/useAsyncData";
import { apiClient } from "@/lib/api-client";
import type { ThreadDto } from "@/model/chat/chat.dto";

export type Threads = AsyncData<readonly ThreadDto[]> & {
  readonly create: () => Promise<ThreadDto | undefined>;
  readonly isCreating: boolean;
  readonly remove: (threadId: string) => Promise<true | undefined>;
  readonly actionError: unknown;
};

/** Lists the signed-in user's own threads in a project, and creates or deletes them. */
export function useThreads(projectId: string): Threads {
  const base = `/api/projects/${projectId}/threads`;
  const load = useCallback(
    (signal: AbortSignal) => apiClient.get<readonly ThreadDto[]>(base, signal),
    [base],
  );
  const state = useAsyncData(load);
  const { refetch } = state;

  const createRequest = useCallback(async () => {
    const thread = await apiClient.post<ThreadDto>(base, {});
    await refetch();
    return thread;
  }, [base, refetch]);
  const removeRequest = useCallback(
    async (threadId: string) => {
      try {
        await apiClient.delete(`/api/threads/${threadId}`);
        return true as const;
      } finally {
        await refetch();
      }
    },
    [refetch],
  );

  const creating = useAsyncAction(createRequest);
  const removing = useAsyncAction(removeRequest);

  return {
    ...state,
    create: creating.run,
    isCreating: creating.isRunning,
    remove: removing.run,
    actionError: creating.error ?? removing.error,
  };
}
