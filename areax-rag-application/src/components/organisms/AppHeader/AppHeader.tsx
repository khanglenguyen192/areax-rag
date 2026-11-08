"use client";

import { Button, TextLink } from "@/components/atoms";
import { useT } from "@/hooks/common/useT";
import styles from "./AppHeader.module.scss";

type AppHeaderProps = {
  readonly username: string;
  readonly onSignOut: () => void;
};

export function AppHeader({ username, onSignOut }: AppHeaderProps) {
  const t = useT();

  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <TextLink href="/home">{t("app.name")}</TextLink>
        <div className={styles.user}>
          <span className={styles.name}>{t("header.signedInAs", { username })}</span>
          <Button variant="text" onClick={onSignOut}>
            {t("header.signOut")}
          </Button>
        </div>
      </div>
    </header>
  );
}
