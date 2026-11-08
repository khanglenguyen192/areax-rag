"use client";

import { PromptEditor } from "@/components/organisms";
import { useT } from "@/hooks/common/useT";
import type { Project } from "@/hooks/projects/useProject";
import { describeError } from "@/lib/describe-error";
import type { ProjectDetailDto } from "@/model/project/project.dto";

type ProjectPromptTabProps = {
  readonly project: Project;
  readonly detail: ProjectDetailDto;
};

/** Reuses the project loaded by `ProjectView` so the prompt is not fetched twice. */
export function ProjectPromptTab({ project, detail }: ProjectPromptTabProps) {
  const t = useT();

  return (
    <PromptEditor
      prompt={detail.prompt}
      isSaving={project.isSavingPrompt}
      errorMessage={project.savePromptError ? describeError(project.savePromptError, t) : undefined}
      onSave={async (prompt) => (await project.savePrompt({ prompt })) !== undefined}
    />
  );
}
