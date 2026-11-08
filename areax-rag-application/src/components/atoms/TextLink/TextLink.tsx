import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./TextLink.module.scss";

type TextLinkProps = {
  readonly href: string;
  readonly children: ReactNode;
  readonly ariaLabel?: string;
};

export function TextLink({ href, children, ariaLabel }: TextLinkProps) {
  return (
    <Link className={styles.root} href={href} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
