import "server-only";
import type { ProjectMember, ProjectRole, User } from "@/generated/prisma/client";
import type { ProjectWithCounts } from "@/server/model/mappers";
import { getPrisma } from "./prisma";

const COUNTS = { _count: { select: { members: true, documents: true } } } as const;

export type MembershipWithProject = ProjectMember & { readonly project: ProjectWithCounts };

export const projectRepository = {
  findMembership: (projectId: string, userId: string): Promise<ProjectMember | null> =>
    getPrisma().projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } }),

  listMembershipsForUser: (userId: string): Promise<MembershipWithProject[]> =>
    getPrisma().projectMember.findMany({
      where: { userId },
      include: { project: { include: COUNTS } },
      orderBy: { joinedAt: "desc" },
    }),

  findWithCounts: (projectId: string): Promise<ProjectWithCounts | null> =>
    getPrisma().project.findUnique({ where: { id: projectId }, include: COUNTS }),

  /** Creates the project and its owner membership in one transaction. */
  create: (userId: string, name: string, description: string | null): Promise<ProjectWithCounts> =>
    getPrisma().project.create({
      data: { name, description, members: { create: { userId, role: "OWNER" } } },
      include: COUNTS,
    }),

  updatePrompt: (projectId: string, prompt: string): Promise<{ prompt: string }> =>
    getPrisma().project.update({
      where: { id: projectId },
      data: { prompt },
      select: { prompt: true },
    }),

  delete: async (projectId: string): Promise<void> => {
    await getPrisma().project.delete({ where: { id: projectId } });
  },

  listMembers: (projectId: string): Promise<(ProjectMember & { user: User })[]> =>
    getPrisma().projectMember.findMany({
      where: { projectId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    }),

  addMember: (
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<ProjectMember & { user: User }> =>
    getPrisma().projectMember.create({
      data: { projectId, userId, role },
      include: { user: true },
    }),

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await getPrisma().projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
  },
};
