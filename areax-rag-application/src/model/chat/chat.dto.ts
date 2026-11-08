export type ThreadDto = {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
};

export type MessageRole = "USER" | "ASSISTANT";

export type MessageStatus = "STREAMING" | "DONE" | "FAILED";

export type MessageDto = {
  readonly id: string;
  readonly threadId: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly status: MessageStatus;
  /** Error code when `status` is `FAILED`. */
  readonly failureCode: string | null;
  readonly createdAt: string;
};

export type SendMessageInput = {
  readonly content: string;
};

export type SendMessageResultDto = {
  readonly userMessage: MessageDto;
  readonly assistantMessage: MessageDto;
};

export type CreateThreadInput = {
  readonly title?: string;
};
