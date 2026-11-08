import type { ReactNode } from "react";
import styles from "./ProjectLayout.module.scss";

type ProjectLayoutProps = {
  readonly header: ReactNode;
  readonly tabs: ReactNode;
  readonly children: ReactNode;
};

export function ProjectLayout({ header, tabs, children }: ProjectLayoutProps) {
  return (
    <div className={styles.root}>
      {header}
      <div className={styles.tabs}>{tabs}</div>
      <section className={styles.content}>{children}</section>
    </div>
  );
}
