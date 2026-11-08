"use client";

import { useState } from "react";
import { Button } from "@/components/atoms";
import { ErrorMessage, FormField } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import { PROMPT_MAX } from "@/model/project/project.schema";
import styles from "./PromptEditor.module.scss";

type PromptEditorProps = {
  /** The saved prompt; the draft starts from it and is compared with it to enable Save. */
  readonly prompt: string;
  readonly isSaving: boolean;
  readonly errorMessage?: string;
  readonly onSave: (prompt: string) => Promise<boolean>;
};

export function PromptEditor({ prompt, isSaving, errorMessage, onSave }: PromptEditorProps) {
  const t = useT();
  const [draft, setDraft] = useState(prompt);
  const [isSaved, setIsSaved] = useState(false);
  const isDirty = draft !== prompt;

  const handleSave = async () => {
    setIsSaved(false);
    setIsSaved(await onSave(draft));
  };

  return (
    <section className={styles.root} aria-labelledby="prompt-title">
      <h2 id="prompt-title" className={styles.title}>
        {t("prompt.title")}
      </h2>
      <p className={styles.description}>{t("prompt.description")}</p>
      <FormField
        id="project-prompt"
        label={t("prompt.label")}
        value={draft}
        onChange={(next) => {
          setDraft(next);
          setIsSaved(false);
        }}
        placeholder={t("prompt.placeholder")}
        rows={8}
        maxLength={PROMPT_MAX}
        disabled={isSaving}
      />
      {errorMessage && <ErrorMessage message={errorMessage} />}
      <div className={styles.actions}>
        <Button isLoading={isSaving} disabled={!isDirty} onClick={() => void handleSave()}>
          {t("common.save")}
        </Button>
        {isSaved && !isDirty && (
          <span className={styles.saved} role="status">
            {t("prompt.saved")}
          </span>
        )}
      </div>
    </section>
  );
}
