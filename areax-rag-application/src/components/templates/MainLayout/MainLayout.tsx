import type { ReactNode } from "react";
import styles from "./MainLayout.module.scss";

type MainLayoutProps = {
  readonly header: ReactNode;
  readonly children: ReactNode;
};

export function MainLayout({ header, children }: MainLayoutProps) {
  return (
    <div className={styles.root}>
      {header}
      <main className={styles.main}>{children}</main>
    </div>
  );
}
