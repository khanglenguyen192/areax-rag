import type { ReactNode } from "react";
import { MainShell } from "@/features/main-shell/MainShell";

type MainGroupLayoutProps = {
  readonly children: ReactNode;
};

export default function MainGroupLayout({ children }: MainGroupLayoutProps) {
  return <MainShell>{children}</MainShell>;
}
