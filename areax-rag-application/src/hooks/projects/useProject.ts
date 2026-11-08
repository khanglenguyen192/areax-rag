import { useCallback } from "react";
import { useAsyncAction } from "@/hooks/common/useAsyncAction";
import { useAsyncData, type AsyncData } from "@/hooks/common/useAsyncData";
import { apiClient } from "@/lib/api-client";
import type { ProjectDetailDto, UpdatePromptInput } from "@/model/project/project.dto";

export type Project = AsyncData<ProjectDetailDto> & {
  readonly savePrompt: (input: UpdatePromptInput) => Promise<{ prompt: string } | undefined>;
  readonly isSavingPrompt: boolean;
  readonly savePromptError: unknown;
  /** Leaves the project. Does not refetch: the caller must navigate away (the project is gone for this user). */
  readonly leave: () => Promise<true | undefined>;
  readonly isLeaving: boolean;
  readonly leaveError: unknown;
  /** Deletes the project (owner only). Does not refetch, for the same reason as `leave`. */
  readonly deleteProject: () => Promise<true | undefined>;
  readonly isDeleting: boolean;
  readonly deleteError: unknown;
};

/** Loads one project with its prompt, and exposes the project-level writes. */
export function useProject(projectId: string): Project {
  const load = useCallback(
    (signal: AbortSignal) => apiClient.get<ProjectDetailDto>(`/api/projects/${projectId}`, signal),
    [projectId],
  );
  const state = useAsyncData(load);
  const { refetch } = state;

  const savePromptRequest = useCallback(
    async (input: UpdatePromptInput) => {
      const result = await apiClient.put<{ prompt: string }>(
        `/api/projects/${projectId}/prompt`,
        input,
      );
      await refetch();
      return result;
    },
    [projectId, refetch],
  );
  const leaveRequest = useCallback(async () => {
    await apiClient.post(`/api/projects/${projectId}/leave`);
    return true as const;
  }, [projectId]);
  const deleteRequest = useCallback(async () => {
    await apiClient.delete(`/api/projects/${projectId}`);
    return true as const;
  }, [projectId]);

  const saving = useAsyncAction(savePromptRequest);
  const leaving = useAsyncAction(leaveRequest);
  const deleting = useAsyncAction(deleteRequest);

  return {
    ...state,
    savePrompt: saving.run,
    isSavingPrompt: saving.isRunning,
    savePromptError: saving.error,
    leave: leaving.run,
    isLeaving: leaving.isRunning,
    leaveError: leaving.error,
    deleteProject: deleting.run,
    isDeleting: deleting.isRunning,
    deleteError: deleting.error,
  };
}
