import type { Tone } from "@/shared/tone";
import styles from "./StatusChip.module.scss";

type StatusChipProps = {
  readonly label: string;
  readonly tone?: Tone;
};

export function StatusChip({ label, tone = "neutral" }: StatusChipProps) {
  return <span className={`${styles.root} ${styles[tone]}`}>{label}</span>;
}
