import LinearProgress from "@mui/material/LinearProgress";

type ProgressBarProps = {
  /** 0 to 100. */
  readonly value: number;
  readonly label: string;
  readonly isWarning?: boolean;
};

export function ProgressBar({ value, label, isWarning = false }: ProgressBarProps) {
  return (
    <LinearProgress
      variant="determinate"
      value={Math.min(100, Math.max(0, value))}
      color={isWarning ? "warning" : "primary"}
      aria-label={label}
    />
  );
}
