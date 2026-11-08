import type { ProjectRole } from "./project.dto";

export type MemberDto = {
  readonly id: string;
  readonly username: string;
  readonly role: ProjectRole;
  readonly joinedAt: string;
};

export type AddMemberInput = {
  readonly username: string;
};
