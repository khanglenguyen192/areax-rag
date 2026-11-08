"use client";

import { EmptyState } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import type { ProjectDto } from "@/model/project/project.dto";
import { ProjectCard } from "../ProjectCard";
import styles from "./ProjectGrid.module.scss";

type ProjectGridProps = {
  readonly projects: readonly ProjectDto[];
  /** Shown in the empty state so the user can start. */
  readonly emptyAction?: React.ReactNode;
};

export function ProjectGrid({ projects, emptyAction }: ProjectGridProps) {
  const t = useT();

  if (projects.length === 0) {
    return (
      <EmptyState
        title={t("home.empty.title")}
        description={t("home.empty.description")}
        action={emptyAction}
      />
    );
  }

  return (
    <ul className={`row g-3 ${styles.list}`}>
      {projects.map((project) => (
        <li key={project.id} className="col-12 col-md-6 col-lg-4">
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}
