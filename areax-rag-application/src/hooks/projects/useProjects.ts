import { useCallback } from "react";
import { useAsyncAction } from "@/hooks/common/useAsyncAction";
import { useAsyncData, type AsyncData } from "@/hooks/common/useAsyncData";
import { apiClient } from "@/lib/api-client";
import type { Page } from "@/model/api/api-response.dto";
import type { CreateProjectInput, ProjectDto } from "@/model/project/project.dto";

export type Projects = AsyncData<Page<ProjectDto>> & {
  readonly create: (input: CreateProjectInput) => Promise<ProjectDto | undefined>;
  readonly isCreating: boolean;
  readonly createError: unknown;
  readonly resetCreateError: () => void;
};

/** Lists the signed-in user's projects and creates new ones. */
export function useProjects(): Projects {
  const load = useCallback(
    (signal: AbortSignal) => apiClient.get<Page<ProjectDto>>("/api/projects", signal),
    [],
  );
  const state = useAsyncData(load);
  const { refetch } = state;

  const createRequest = useCallback(
    async (input: CreateProjectInput) => {
      const project = await apiClient.post<ProjectDto>("/api/projects", input);
      await refetch();
      return project;
    },
    [refetch],
  );
  const creating = useAsyncAction(createRequest);

  return {
    ...state,
    create: creating.run,
    isCreating: creating.isRunning,
    createError: creating.error,
    resetCreateError: creating.reset,
  };
}
