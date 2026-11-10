import "server-only";
import type { ProjectMember, ProjectRole } from "@/generated/prisma/client";
import { AppError } from "@/server/errors/app-error";
import { projectRepository } from "@/server/repositories/project-repository";

/**
 * Checks that `userId` belongs to the project, and optionally that they hold `role`.
 * Every service method that touches a project calls this first.
 *
 * A non-member gets `PROJECT_NOT_FOUND` rather than `FORBIDDEN`, so the existence of a project is
 * not revealed to people who are not in it.
 *
 * @throws AppError `PROJECT_NOT_FOUND` when the user is not a member.
 * @throws AppError `FORBIDDEN` when the user is a member without the required role.
 */
export async function requireProjectRole(
  projectId: string,
  userId: string,
  role?: ProjectRole,
): Promise<ProjectMember> {
  const membership = await projectRepository.findMembership(projectId, userId);
  if (!membership) throw new AppError("PROJECT_NOT_FOUND");
  if (role && membership.role !== role) throw new AppError("FORBIDDEN");
  return membership;
}
