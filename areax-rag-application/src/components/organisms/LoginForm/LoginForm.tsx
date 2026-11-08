"use client";

import { useState } from "react";
import { Alert, Button } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import type { LoginInput } from "@/model/auth/auth.dto";
import { loginSchema } from "@/model/auth/auth.schema";
import styles from "./LoginForm.module.scss";

type LoginFormProps = {
  readonly isSubmitting: boolean;
  /** Already translated; shown above the form. */
  readonly errorMessage?: string;
  readonly fieldErrors?: Readonly<Record<string, string>>;
  readonly onSubmit: (input: LoginInput) => void;
};

export function LoginForm({
  isSubmitting,
  errorMessage,
  fieldErrors = {},
  onSubmit,
}: LoginFormProps) {
  const t = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localErrors, setLocalErrors] = useState<Readonly<Record<string, string>>>({});
  const errors = { ...fieldErrors, ...localErrors };

  const handleSubmit = () => {
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = t("field.REQUIRED");
      setLocalErrors(next);
      return;
    }
    setLocalErrors({});
    onSubmit({ username: parsed.data.username, password: parsed.data.password });
  };

  return (
    <form
      className={styles.root}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <h1 className={styles.title}>{t("login.title")}</h1>
      <p className={styles.subtitle}>{t("login.subtitle")}</p>
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
      <FormField
        id="login-username"
        label={t("login.username")}
        value={username}
        onChange={setUsername}
        error={errors.username}
        autoComplete="username"
        autoFocus
        disabled={isSubmitting}
      />
      <FormField
        id="login-password"
        label={t("login.password")}
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="current-password"
        disabled={isSubmitting}
      />
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        {t("login.submit")}
      </Button>
    </form>
  );
}
