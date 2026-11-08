import MuiAlert from "@mui/material/Alert";
import type { ReactNode } from "react";

type AlertProps = {
  readonly tone: "info" | "success" | "warning" | "error";
  readonly children: ReactNode;
  readonly action?: ReactNode;
};

export function Alert({ tone, children, action }: AlertProps) {
  return (
    <MuiAlert severity={tone} action={action}>
      {children}
    </MuiAlert>
  );
}
