"use client";

import { useState } from "react";
import { Button } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import styles from "./YoutubeSourceForm.module.scss";

type YoutubeSourceFormProps = {
  readonly isSubmitting: boolean;
  /** Already translated; shown under the input. */
  readonly errorMessage?: string;
  readonly onSubmit: (url: string) => Promise<boolean>;
};

export function YoutubeSourceForm({
  isSubmitting,
  errorMessage,
  onSubmit,
}: YoutubeSourceFormProps) {
  const t = useT();
  const [url, setUrl] = useState("");

  const handleSubmit = async () => {
    if (!url.trim()) return;
    if (await onSubmit(url.trim())) setUrl("");
  };

  return (
    <form
      className={styles.root}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <div className={styles.field}>
        <FormField
          id="youtube-url"
          label={t("documents.youtube.label")}
          value={url}
          onChange={setUrl}
          error={errorMessage}
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" variant="secondary" isLoading={isSubmitting} disabled={!url.trim()}>
        {t("documents.youtube.add")}
      </Button>
    </form>
  );
}
