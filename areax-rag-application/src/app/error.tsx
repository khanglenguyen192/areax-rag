"use client";

import { ErrorMessage } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";

type ErrorPageProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  const t = useT();
  return <ErrorMessage message={t("boundary.description")} onRetry={reset} />;
}
