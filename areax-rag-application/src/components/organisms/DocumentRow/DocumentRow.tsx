"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { IconButton, StatusChip } from "@/components/atoms";
import { useLocale, useT, type TranslationKey } from "@/hooks/common/useT";
import type { DocumentDto, DocumentStatus } from "@/model/document/document.dto";
import { formatBytes } from "@/shared/format-bytes";
import type { Tone } from "@/shared/tone";
import styles from "./DocumentRow.module.scss";

type DocumentRowProps = {
  readonly document: DocumentDto;
  readonly onDelete: (document: DocumentDto) => void;
};

const STATUS_TONE: Record<DocumentStatus, Tone> = {
  PROCESSING: "info",
  READY: "success",
  FAILED: "danger",
};

export function DocumentRow({ document, onDelete }: DocumentRowProps) {
  const t = useT();
  const locale = useLocale();
  const failureKey = `error.${document.failureCode}` as TranslationKey;
  const detail = document.status === "FAILED" && document.failureCode ? t(failureKey) : null;

  return (
    <li className={styles.root}>
      <div className={styles.main}>
        <span className={styles.name}>{document.name}</span>
        <span className={styles.meta}>
          {t(`documents.kind.${document.kind}`)}
          {document.kind === "FILE" && ` · ${formatBytes(document.sizeBytes)}`}
          {` · ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(document.createdAt))}`}
        </span>
        {detail && <span className={styles.failure}>{detail}</span>}
      </div>
      <StatusChip
        label={t(`documents.status.${document.status}`)}
        tone={STATUS_TONE[document.status]}
      />
      <IconButton
        icon={<DeleteOutlined fontSize="small" />}
        ariaLabel={t("documents.delete.aria", { name: document.name })}
        onClick={() => onDelete(document)}
      />
    </li>
  );
}
