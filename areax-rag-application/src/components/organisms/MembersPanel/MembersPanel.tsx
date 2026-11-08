"use client";

import PersonRemoveOutlined from "@mui/icons-material/PersonRemoveOutlined";
import { useState } from "react";
import { Button, IconButton, StatusChip } from "@/components/atoms";
import { ConfirmDialog, ErrorMessage, FormField } from "@/components/molecules";
import { useT } from "@/hooks/common/useT";
import type { MemberDto } from "@/model/project/member.dto";
import styles from "./MembersPanel.module.scss";

type MembersPanelProps = {
  readonly members: readonly MemberDto[];
  readonly currentUserId: string;
  /** True for the owner: shows add and remove controls. */
  readonly canManage: boolean;
  readonly isAdding: boolean;
  readonly addError?: string;
  readonly actionError?: string;
  readonly onAdd: (username: string) => Promise<boolean>;
  readonly onRemove: (memberId: string) => Promise<void>;
};

export function MembersPanel({
  members,
  currentUserId,
  canManage,
  isAdding,
  addError,
  actionError,
  onAdd,
  onRemove,
}: MembersPanelProps) {
  const t = useT();
  const [username, setUsername] = useState("");
  const [pendingRemove, setPendingRemove] = useState<MemberDto | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAdd = async () => {
    if (!username.trim()) return;
    if (await onAdd(username.trim())) setUsername("");
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    setIsRemoving(true);
    await onRemove(pendingRemove.id);
    setIsRemoving(false);
    setPendingRemove(null);
  };

  return (
    <section className={styles.root} aria-labelledby="members-title">
      <h2 id="members-title" className={styles.title}>
        {t("members.title")}
      </h2>

      {canManage && (
        <form
          className={styles.add}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleAdd();
          }}
        >
          <div className={styles.field}>
            <FormField
              id="member-username"
              label={t("members.add.label")}
              value={username}
              onChange={setUsername}
              error={addError}
              disabled={isAdding}
            />
          </div>
          <Button type="submit" isLoading={isAdding} disabled={!username.trim()}>
            {t("members.add.submit")}
          </Button>
        </form>
      )}

      {actionError && <ErrorMessage message={actionError} />}

      <ul className={styles.list}>
        {members.map((member) => (
          <li key={member.id} className={styles.row}>
            <span className={styles.name}>
              {member.username}
              {member.id === currentUserId && ` (${t("common.you")})`}
            </span>
            <StatusChip
              label={t(member.role === "OWNER" ? "members.owner" : "members.member")}
              tone={member.role === "OWNER" ? "info" : "neutral"}
            />
            {canManage && member.role !== "OWNER" && (
              <IconButton
                icon={<PersonRemoveOutlined fontSize="small" />}
                ariaLabel={t("members.remove.aria", { username: member.username })}
                onClick={() => setPendingRemove(member)}
              />
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={pendingRemove !== null}
        title={t("members.remove.title")}
        description={t("members.remove.description", { username: pendingRemove?.username ?? "" })}
        confirmLabel={t("common.remove")}
        isConfirming={isRemoving}
        onConfirm={() => void handleConfirmRemove()}
        onCancel={() => setPendingRemove(null)}
      />
    </section>
  );
}
