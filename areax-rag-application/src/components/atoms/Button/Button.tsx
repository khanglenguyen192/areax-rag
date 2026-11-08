import MuiButton from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import type { MouseEventHandler, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "text";

type ButtonProps = {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant;
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
  readonly isLoading?: boolean;
  readonly fullWidth?: boolean;
  readonly startIcon?: ReactNode;
  readonly ariaLabel?: string;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
};

const VARIANTS = {
  primary: { variant: "contained", color: "primary" },
  secondary: { variant: "outlined", color: "primary" },
  danger: { variant: "contained", color: "error" },
  text: { variant: "text", color: "primary" },
} as const;

export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  isLoading = false,
  fullWidth = false,
  startIcon,
  ariaLabel,
  onClick,
}: ButtonProps) {
  const style = VARIANTS[variant];
  return (
    <MuiButton
      {...style}
      type={type}
      disabled={disabled || isLoading}
      fullWidth={fullWidth}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      onClick={onClick}
    >
      {children}
    </MuiButton>
  );
}
