"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/atoms";
import { ConfirmDialog, EmptyState, ErrorMessage, FilePicker } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import type { DocumentDto, DocumentListDto } from "@/model/document/document.dto";
import { formatBytes } from "@/shared/format-bytes";
import { DocumentRow } from "../DocumentRow";
import { YoutubeSourceForm } from "../YoutubeSourceForm";
import styles from "./DocumentPanel.module.scss";

type DocumentPanelProps = {
  readonly documents: DocumentListDto;
  readonly isUploading: boolean;
  readonly isAddingYoutube: boolean;
  /** Translated failure of the last upload, delete, or reload. */
  readonly actionError?: string;
  readonly youtubeError?: string;
  readonly onUpload: (file: File) => void;
  readonly onAddYoutube: (url: string) => Promise<boolean>;
  readonly onDelete: (documentId: string) => Promise<void>;
};

const ACCEPT = ".pdf,.docx,.md,.txt";

export function DocumentPanel({
  documents,
  isUploading,
  isAddingYoutube,
  actionError,
  youtubeError,
  onUpload,
  onAddYoutube,
  onDelete,
}: DocumentPanelProps) {
  const t = useT();
  const [pendingDelete, setPendingDelete] = useState<DocumentDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const usedPercent =
    documents.limitBytes > 0 ? (documents.usedBytes / documents.limitBytes) * 100 : 0;

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    await onDelete(pendingDelete.id);
    setIsDeleting(false);
    setPendingDelete(null);
  };

  return (
    <section className={styles.root} aria-labelledby="documents-title">
      <h2 id="documents-title" className={styles.title}>
        {t("documents.title")}
      </h2>

      <div className={styles.usage}>
        <ProgressBar
          value={usedPercent}
          label={t("documents.title")}
          isWarning={usedPercent >= 90}
        />
        <span className={styles.usageText}>
          {t("documents.usage", {
            used: formatBytes(documents.usedBytes),
            limit: formatBytes(documents.limitBytes),
          })}
        </span>
      </div>

      <div className={styles.actions}>
        <FilePicker
          label={t("documents.upload")}
          accept={ACCEPT}
          isLoading={isUploading}
          onPick={onUpload}
        />
        <span className={styles.hint}>
          {t("documents.upload.hint", { max: formatBytes(documents.fileMaxBytes) })}
        </span>
      </div>
      <YoutubeSourceForm
        isSubmitting={isAddingYoutube}
        errorMessage={youtubeError}
        onSubmit={onAddYoutube}
      />

      {actionError && <ErrorMessage message={actionError} />}

      {documents.items.length === 0 ? (
        <EmptyState
          title={t("documents.empty.title")}
          description={t("documents.empty.description")}
        />
      ) : (
        <ul className={styles.list}>
          {documents.items.map((document) => (
            <DocumentRow key={document.id} document={document} onDelete={setPendingDelete} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={t("documents.delete.title")}
        description={t("documents.delete.description", { name: pendingDelete?.name ?? "" })}
        confirmLabel={t("common.delete")}
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
