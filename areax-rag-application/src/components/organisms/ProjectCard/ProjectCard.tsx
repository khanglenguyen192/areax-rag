"use client";

import Link from "next/link";
import { StatusChip } from "@/components/atoms";
import { useT } from "@/hooks/common/useT";
import type { ProjectDto } from "@/model/project/project.dto";
import styles from "./ProjectCard.module.scss";

type ProjectCardProps = {
  readonly project: ProjectDto;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useT();

  return (
    <Link
      className={styles.root}
      href={`/projects/${project.id}`}
      aria-label={t("project.card.open", { name: project.name })}
    >
      <div className={styles.top}>
        <h2 className={styles.name}>{project.name}</h2>
        <StatusChip
          label={t(
            project.role === "OWNER" ? "project.card.role.OWNER" : "project.card.role.MEMBER",
          )}
          tone={project.role === "OWNER" ? "info" : "neutral"}
        />
      </div>
      {project.description && <p className={styles.description}>{project.description}</p>}
      <p className={styles.meta}>
        {t("project.card.documents", { count: project.documentCount })} ·{" "}
        {t("project.card.members", { count: project.memberCount })}
      </p>
    </Link>
  );
}
