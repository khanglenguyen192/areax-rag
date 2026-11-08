import MuiIconButton from "@mui/material/IconButton";
import type { MouseEventHandler, ReactNode } from "react";

type IconButtonProps = {
  readonly icon: ReactNode;
  readonly ariaLabel: string;
  readonly disabled?: boolean;
  readonly onClick: MouseEventHandler<HTMLButtonElement>;
};

export function IconButton({ icon, ariaLabel, disabled = false, onClick }: IconButtonProps) {
  return (
    <MuiIconButton size="small" aria-label={ariaLabel} disabled={disabled} onClick={onClick}>
      {icon}
    </MuiIconButton>
  );
}
