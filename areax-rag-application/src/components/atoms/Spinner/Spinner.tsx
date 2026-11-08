import CircularProgress from "@mui/material/CircularProgress";
import styles from "./Spinner.module.scss";

type SpinnerProps = {
  /** Accessible name; pass translated text. */
  readonly label: string;
  readonly isCentered?: boolean;
};

export function Spinner({ label, isCentered = false }: SpinnerProps) {
  return (
    <div className={isCentered ? styles.centered : undefined} role="status" aria-label={label}>
      <CircularProgress size={28} />
    </div>
  );
}
