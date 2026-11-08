"use client";

import { Spinner } from "@/components/atoms";
import { ErrorMessage } from "@/components/molecules";
import { MembersPanel } from "@/components/organisms";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useT } from "@/hooks/common/useT";
import { useProjectMembers } from "@/hooks/members/useProjectMembers";
import { describeError } from "@/lib/describe-error";

type ProjectMembersTabProps = {
  readonly projectId: string;
  readonly isOwner: boolean;
};

export function ProjectMembersTab({ projectId, isOwner }: ProjectMembersTabProps) {
  const t = useT();
  const user = useCurrentUser();
  const members = useProjectMembers(projectId);

  if (members.isLoading) return <Spinner label={t("common.loading")} isCentered />;
  if (!members.data)
    return <ErrorMessage message={t("members.error")} onRetry={() => void members.refetch()} />;

  return (
    <MembersPanel
      members={members.data}
      currentUserId={user.id}
      canManage={isOwner}
      isAdding={members.isAdding}
      addError={members.addError ? describeError(members.addError, t) : undefined}
      actionError={members.removeError ? describeError(members.removeError, t) : undefined}
      onAdd={async (username) => {
        members.resetAddError();
        return (await members.add({ username })) !== undefined;
      }}
      onRemove={async (memberId) => {
        await members.remove(memberId);
      }}
    />
  );
}
