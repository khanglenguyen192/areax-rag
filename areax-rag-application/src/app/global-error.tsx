"use client";

import { ThemeProvider } from "@/components/providers";
import { ErrorMessage } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";

type GlobalErrorProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  const t = useT();
  // The root layout is gone when this renders, so it brings its own <html>, <body> and theme.
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ErrorMessage message={t("boundary.description")} onRetry={reset} />
        </ThemeProvider>
      </body>
    </html>
  );
}
