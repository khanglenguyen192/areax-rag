"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { useState } from "react";
import { Button, IconButton } from "@/components/atoms";
import { ConfirmDialog, ErrorMessage } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import type { ThreadDto } from "@/model/chat/chat.dto";
import styles from "./ThreadList.module.scss";

type ThreadListProps = {
  readonly threads: readonly ThreadDto[];
  readonly selectedThreadId: string | null;
  readonly isCreating: boolean;
  readonly errorMessage?: string;
  readonly onSelect: (threadId: string) => void;
  readonly onCreate: () => void;
  readonly onDelete: (threadId: string) => Promise<void>;
};

export function ThreadList({
  threads,
  selectedThreadId,
  isCreating,
  errorMessage,
  onSelect,
  onCreate,
  onDelete,
}: ThreadListProps) {
  const t = useT();
  const [pendingDelete, setPendingDelete] = useState<ThreadDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const titleOf = (thread: ThreadDto) => thread.title || t("chat.threads.untitled");

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    await onDelete(pendingDelete.id);
    setIsDeleting(false);
    setPendingDelete(null);
  };

  return (
    <nav className={styles.root} aria-label={t("chat.threads.title")}>
      <Button variant="secondary" fullWidth isLoading={isCreating} onClick={onCreate}>
        {t("chat.threads.new")}
      </Button>
      {errorMessage && <ErrorMessage message={errorMessage} />}
      {threads.length === 0 ? (
        <p className={styles.empty}>{t("chat.threads.empty")}</p>
      ) : (
        <ul className={styles.list}>
          {threads.map((thread) => (
            <li
              key={thread.id}
              className={thread.id === selectedThreadId ? styles.itemSelected : styles.item}
            >
              <button
                type="button"
                className={styles.select}
                aria-current={thread.id === selectedThreadId || undefined}
                onClick={() => onSelect(thread.id)}
              >
                {titleOf(thread)}
              </button>
              <IconButton
                icon={<DeleteOutlined fontSize="small" />}
                ariaLabel={t("chat.threads.delete.aria", { title: titleOf(thread) })}
                onClick={() => setPendingDelete(thread)}
              />
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={t("chat.threads.delete.title")}
        description={t("chat.threads.delete.description")}
        confirmLabel={t("common.delete")}
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </nav>
  );
}
