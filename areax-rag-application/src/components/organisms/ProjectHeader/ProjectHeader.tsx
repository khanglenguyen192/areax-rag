"use client";

import { Button, TextLink } from "@/components/atoms";
import { ConfirmDialog } from "@/components/molecules";
import { useDisclosure } from "@/hooks/common/useDisclosure";
import { useT } from "@/hooks/common/useT";
import type { ProjectDetailDto } from "@/model/project/project.dto";
import styles from "./ProjectHeader.module.scss";

type ProjectHeaderProps = {
  readonly project: ProjectDetailDto;
  readonly isLeaving: boolean;
  readonly isDeleting: boolean;
  readonly onLeave: () => void;
  readonly onDelete: () => void;
};

export function ProjectHeader({
  project,
  isLeaving,
  isDeleting,
  onLeave,
  onDelete,
}: ProjectHeaderProps) {
  const t = useT();
  const leaveDialog = useDisclosure();
  const deleteDialog = useDisclosure();
  const isOwner = project.role === "OWNER";

  return (
    <div className={styles.root}>
      <div className={styles.text}>
        <TextLink href="/home">{t("project.back")}</TextLink>
        <h1 className={styles.title}>{project.name}</h1>
        {project.description && <p className={styles.description}>{project.description}</p>}
      </div>
      {isOwner ? (
        <Button variant="danger" onClick={deleteDialog.open}>
          {t("project.delete")}
        </Button>
      ) : (
        <Button variant="secondary" onClick={leaveDialog.open}>
          {t("project.leave")}
        </Button>
      )}

      <ConfirmDialog
        isOpen={leaveDialog.isOpen}
        title={t("project.leave.title")}
        description={t("project.leave.description")}
        confirmLabel={t("project.leave")}
        isConfirming={isLeaving}
        onConfirm={onLeave}
        onCancel={leaveDialog.close}
      />
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={t("project.delete.title")}
        description={t("project.delete.description")}
        confirmLabel={t("project.delete")}
        isConfirming={isDeleting}
        onConfirm={onDelete}
        onCancel={deleteDialog.close}
      />
    </div>
  );
}
