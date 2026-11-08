"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/components/atoms";
import { ErrorMessage } from "@/components/molecules";
import { AppHeader } from "@/components/organisms";
import { SessionContext } from "@/components/providers/session-context";
import { SseProvider } from "@/components/providers";
import { MainLayout } from "@/components/templates";
import { useSession } from "@/hooks/auth/useSession";
import { useT } from "@/hooks/common/useT";
import { describeError } from "@/lib/describe-error";

type MainShellProps = {
  readonly children: ReactNode;
};

/** Gates the signed-in area: loads the session once and provides the header, user and SSE stream. */
export function MainShell({ children }: MainShellProps) {
  const t = useT();
  const session = useSession();

  if (session.isLoading) return <Spinner label={t("common.loading")} isCentered />;
  if (session.error || !session.data) {
    return (
      <ErrorMessage
        message={describeError(session.error, t)}
        onRetry={() => void session.refetch()}
      />
    );
  }

  return (
    <SessionContext.Provider value={session.data}>
      <SseProvider>
        <MainLayout
          header={
            <AppHeader username={session.data.username} onSignOut={() => void session.signOut()} />
          }
        >
          {children}
        </MainLayout>
      </SseProvider>
    </SessionContext.Provider>
  );
}
