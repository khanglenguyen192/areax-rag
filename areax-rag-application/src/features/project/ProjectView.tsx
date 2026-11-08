"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner, Tabs, type TabItem } from "@/components/atoms";
import { ErrorMessage } from "@/components/molecules";
import { ProjectHeader } from "@/components/organisms";
import { ProjectLayout } from "@/components/templates";
import { useT } from "@/hooks/common/useT";
import { useProject } from "@/hooks/projects/useProject";
import { isApiError } from "@/lib/api-error";
import { describeError } from "@/lib/describe-error";
import { ProjectChatTab } from "./ProjectChatTab";
import { ProjectDocumentsTab } from "./ProjectDocumentsTab";
import { ProjectMembersTab } from "./ProjectMembersTab";
import { ProjectPromptTab } from "./ProjectPromptTab";

type ProjectViewProps = {
  readonly projectId: string;
};

type TabValue = "documents" | "prompt" | "chat" | "members";

export function ProjectView({ projectId }: ProjectViewProps) {
  const t = useT();
  const router = useRouter();
  const project = useProject(projectId);
  const [tab, setTab] = useState<TabValue>("documents");

  const tabs: readonly TabItem[] = [
    { value: "documents", label: t("project.tab.documents") },
    { value: "prompt", label: t("project.tab.prompt") },
    { value: "chat", label: t("project.tab.chat") },
    { value: "members", label: t("project.tab.members") },
  ];

  // After leaving or deleting, the project is gone for this user: go to the list without refetching it.
  const handleLeave = async () => {
    if (await project.leave()) router.replace("/home");
  };
  const handleDelete = async () => {
    if (await project.deleteProject()) router.replace("/home");
  };

  if (project.isLoading) return <Spinner label={t("common.loading")} isCentered />;
  if (project.error !== undefined || !project.data) {
    const message = isApiError(project.error)
      ? describeError(project.error, t)
      : t("project.error");
    return <ErrorMessage message={message} onRetry={() => void project.refetch()} />;
  }

  const detail = project.data;
  const actionError = project.leaveError ?? project.deleteError;

  return (
    <ProjectLayout
      header={
        <>
          <ProjectHeader
            project={detail}
            isLeaving={project.isLeaving}
            isDeleting={project.isDeleting}
            onLeave={() => void handleLeave()}
            onDelete={() => void handleDelete()}
          />
          {actionError !== undefined && <ErrorMessage message={describeError(actionError, t)} />}
        </>
      }
      tabs={
        <Tabs
          items={tabs}
          value={tab}
          ariaLabel={t("project.tab.documents")}
          onChange={(next) => setTab(next as TabValue)}
        />
      }
    >
      {tab === "documents" && <ProjectDocumentsTab projectId={projectId} />}
      {tab === "prompt" && <ProjectPromptTab project={project} detail={detail} />}
      {tab === "chat" && <ProjectChatTab projectId={projectId} />}
      {tab === "members" && (
        <ProjectMembersTab projectId={projectId} isOwner={detail.role === "OWNER"} />
      )}
    </ProjectLayout>
  );
}
