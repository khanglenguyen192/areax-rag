import { useCallback } from "react";
import { useAsyncAction } from "@/hooks/common/useAsyncAction";
import { useAsyncData, type AsyncData } from "@/hooks/common/useAsyncData";
import { apiClient } from "@/lib/api-client";
import type { AddMemberInput, MemberDto } from "@/model/project/member.dto";

export type ProjectMembers = AsyncData<readonly MemberDto[]> & {
  readonly add: (input: AddMemberInput) => Promise<MemberDto | undefined>;
  readonly isAdding: boolean;
  readonly addError: unknown;
  readonly resetAddError: () => void;
  readonly remove: (memberId: string) => Promise<true | undefined>;
  readonly isRemoving: boolean;
  readonly removeError: unknown;
};

/** Lists a project's members; the owner adds them by username and removes them. */
export function useProjectMembers(projectId: string, enabled = true): ProjectMembers {
  const load = useCallback(
    (signal: AbortSignal) =>
      apiClient.get<readonly MemberDto[]>(`/api/projects/${projectId}/members`, signal),
    [projectId],
  );
  const state = useAsyncData(load, enabled);
  const { refetch } = state;

  const addRequest = useCallback(
    async (input: AddMemberInput) => {
      try {
        return await apiClient.post<MemberDto>(`/api/projects/${projectId}/members`, input);
      } finally {
        // Refetch even on failure: a 409 means the row already exists, so the list was stale.
        await refetch();
      }
    },
    [projectId, refetch],
  );
  const removeRequest = useCallback(
    async (memberId: string) => {
      try {
        await apiClient.delete(`/api/projects/${projectId}/members/${memberId}`);
        return true as const;
      } finally {
        await refetch();
      }
    },
    [projectId, refetch],
  );

  const adding = useAsyncAction(addRequest);
  const removing = useAsyncAction(removeRequest);

  return {
    ...state,
    add: adding.run,
    isAdding: adding.isRunning,
    addError: adding.error,
    resetAddError: adding.reset,
    remove: removing.run,
    isRemoving: removing.isRunning,
    removeError: removing.error,
  };
}
