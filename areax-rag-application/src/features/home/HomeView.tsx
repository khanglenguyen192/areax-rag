"use client";

import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/atoms";
import { ErrorMessage } from "@/components/molecules";
import { CreateProjectDialog, ProjectGrid } from "@/components/organisms";
import { useDisclosure } from "@/hooks/common/useDisclosure";
import { useT } from "@/hooks/common/useT";
import { useProjects } from "@/hooks/projects/useProjects";
import { describeError, describeFieldErrors } from "@/lib/describe-error";
import type { CreateProjectInput } from "@/model/project/project.dto";

export function HomeView() {
  const t = useT();
  const router = useRouter();
  const projects = useProjects();
  const dialog = useDisclosure();

  const handleCreate = async (input: CreateProjectInput) => {
    const project = await projects.create(input);
    if (project) router.push(`/projects/${project.id}`);
  };

  const handleClose = () => {
    projects.resetCreateError();
    dialog.close();
  };

  const createButton = <Button onClick={dialog.open}>{t("home.create")}</Button>;

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <h1 className="m-0 fs-3">{t("home.title")}</h1>
        {createButton}
      </div>

      {projects.isLoading && <Spinner label={t("common.loading")} isCentered />}
      {projects.error !== undefined && (
        <ErrorMessage message={t("home.error")} onRetry={() => void projects.refetch()} />
      )}
      {projects.data && <ProjectGrid projects={projects.data.items} emptyAction={createButton} />}

      <CreateProjectDialog
        isOpen={dialog.isOpen}
        isSubmitting={projects.isCreating}
        errorMessage={projects.createError ? describeError(projects.createError, t) : undefined}
        fieldErrors={describeFieldErrors(projects.createError, t)}
        onSubmit={(input) => void handleCreate(input)}
        onClose={handleClose}
      />
    </div>
  );
}
