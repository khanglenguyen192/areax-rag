"use client";

import { useState } from "react";
import { Alert, Button, Modal } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import type { CreateProjectInput } from "@/model/project/project.dto";
import {
  PROJECT_DESCRIPTION_MAX,
  PROJECT_NAME_MAX,
  createProjectSchema,
} from "@/model/project/project.schema";

type CreateProjectDialogProps = {
  readonly isOpen: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage?: string;
  readonly fieldErrors?: Readonly<Record<string, string>>;
  readonly onSubmit: (input: CreateProjectInput) => void;
  readonly onClose: () => void;
};

export function CreateProjectDialog({
  isOpen,
  isSubmitting,
  errorMessage,
  fieldErrors = {},
  onSubmit,
  onClose,
}: CreateProjectDialogProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [localErrors, setLocalErrors] = useState<Readonly<Record<string, string>>>({});
  const errors = { ...fieldErrors, ...localErrors };

  const handleSubmit = () => {
    const parsed = createProjectSchema.safeParse({ name, description });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = t(
          issue.message === "TOO_LONG" ? "field.TOO_LONG" : "field.REQUIRED",
        );
      }
      setLocalErrors(next);
      return;
    }
    setLocalErrors({});
    onSubmit({ name: parsed.data.name, description: parsed.data.description || undefined });
  };

  return (
    <Modal
      isOpen={isOpen}
      title={t("project.create.title")}
      onClose={onClose}
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button isLoading={isSubmitting} onClick={handleSubmit}>
            {t("common.create")}
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
        <FormField
          id="project-name"
          label={t("project.create.name")}
          value={name}
          onChange={setName}
          error={errors.name}
          maxLength={PROJECT_NAME_MAX}
          autoFocus
          disabled={isSubmitting}
        />
        <FormField
          id="project-description"
          label={t("project.create.description")}
          value={description}
          onChange={setDescription}
          error={errors.description}
          maxLength={PROJECT_DESCRIPTION_MAX}
          rows={3}
          disabled={isSubmitting}
        />
      </form>
    </Modal>
  );
}
