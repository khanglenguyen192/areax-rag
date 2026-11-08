import type { ReactNode } from "react";
import styles from "./AuthLayout.module.scss";

type AuthLayoutProps = {
  readonly children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className={styles.root}>
      <div className={styles.card}>{children}</div>
    </main>
  );
}
