export type ProjectRole = "OWNER" | "MEMBER";

export type ProjectDto = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly role: ProjectRole;
  readonly memberCount: number;
  readonly documentCount: number;
  readonly createdAt: string;
};

export type ProjectDetailDto = ProjectDto & {
  readonly prompt: string;
};

export type CreateProjectInput = {
  readonly name: string;
  readonly description?: string;
};

export type UpdatePromptInput = {
  readonly prompt: string;
};
