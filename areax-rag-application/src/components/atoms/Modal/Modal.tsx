import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import type { ReactNode } from "react";

type ModalProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
};

export function Modal({ isOpen, title, onClose, children, actions }: ModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="modal-title">
      <DialogTitle id="modal-title">{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {actions && <DialogActions sx={{ px: 3, pb: 2 }}>{actions}</DialogActions>}
    </Dialog>
  );
}
