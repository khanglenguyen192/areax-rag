import { Button, Modal } from "@/components/atoms";
import { useT } from "@/hooks/common/useT";

type ConfirmDialogProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly isConfirming?: boolean;
  readonly isDestructive?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  isConfirming = false,
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useT();

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button variant="text" onClick={onCancel} disabled={isConfirming}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{description}</p>
    </Modal>
  );
}
