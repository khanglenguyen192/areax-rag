import type { ReactNode } from "react";
import styles from "./ChatLayout.module.scss";

type ChatLayoutProps = {
  readonly sidebar: ReactNode;
  readonly content: ReactNode;
};

export function ChatLayout({ sidebar, content }: ChatLayoutProps) {
  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <div className={styles.content}>{content}</div>
    </div>
  );
}
