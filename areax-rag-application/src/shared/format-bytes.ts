const UNITS = ["B", "KB", "MB", "GB"] as const;

/** Formats a byte count with 1024-based units, for example `12.5 MB`. */
export function formatBytes(bytes: number): string {
  let value = Math.max(0, bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = unitIndex === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unitIndex]}`;
}
