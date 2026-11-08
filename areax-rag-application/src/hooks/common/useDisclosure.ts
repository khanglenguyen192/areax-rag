import { useCallback, useState } from "react";

export type Disclosure = {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
};

/** Tracks an open/closed flag, for dialogs and menus. */
export function useDisclosure(initial = false): Disclosure {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
}
