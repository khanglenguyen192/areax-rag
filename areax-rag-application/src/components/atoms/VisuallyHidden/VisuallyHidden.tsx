import { visuallyHidden } from "@mui/utils";
import type { ReactNode } from "react";

type VisuallyHiddenProps = {
  readonly children: ReactNode;
};

/** Text that only assistive technology reads. */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span style={visuallyHidden}>{children}</span>;
}
