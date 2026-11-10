import "server-only";
import type {
  Document,
  Message,
  Project,
  ProjectMember,
  ProjectRole,
  Thread,
  User,
} from "@/generated/prisma/client";
import type { MessageDto, ThreadDto } from "@/model/chat/chat.dto";
import type { DocumentDto, DocumentStatus } from "@/model/document/document.dto";
import type { MemberDto } from "@/model/project/member.dto";
import type { ProjectDetailDto, ProjectDto } from "@/model/project/project.dto";

export type ProjectWithCounts = Project & {
  readonly _count: { readonly members: number; readonly documents: number };
};

export function toProjectDto(project: ProjectWithCounts, role: ProjectRole): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    role,
    memberCount: project._count.members,
    documentCount: project._count.documents,
    createdAt: project.createdAt.toISOString(),
  };
}

export function toProjectDetailDto(
  project: ProjectWithCounts,
  role: ProjectRole,
): ProjectDetailDto {
  return { ...toProjectDto(project, role), prompt: project.prompt };
}

export function toMemberDto(member: ProjectMember & { readonly user: User }): MemberDto {
  return {
    id: member.user.id,
    username: member.user.username,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  };
}

/** A row whose upload is not confirmed yet is shown as processing, like the UI expects. */
function toDocumentStatus(status: Document["status"]): DocumentStatus {
  return status === "PENDING_UPLOAD" ? "PROCESSING" : status;
}

export function toDocumentDto(document: Document): DocumentDto {
  return {
    id: document.id,
    name: document.name,
    kind: document.kind,
    sizeBytes: document.sizeBytes,
    status: toDocumentStatus(document.status),
    failureCode: document.status === "FAILED" ? document.failureCode : null,
    createdAt: document.createdAt.toISOString(),
  };
}

export function toThreadDto(thread: Thread): ThreadDto {
  return { id: thread.id, title: thread.title, updatedAt: thread.updatedAt.toISOString() };
}

export function toMessageDto(message: Message): MessageDto {
  return {
    id: message.id,
    threadId: message.threadId,
    role: message.role,
    content: message.content,
    status: message.status,
    failureCode: message.failureCode,
    createdAt: message.createdAt.toISOString(),
  };
}
