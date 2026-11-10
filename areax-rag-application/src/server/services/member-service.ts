import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { MemberDto } from "@/model/project/member.dto";
import { AppError } from "@/server/errors/app-error";
import { toMemberDto } from "@/server/model/mappers";
import { projectRepository } from "@/server/repositories/project-repository";
import { userRepository } from "@/server/repositories/user-repository";
import { requireProjectRole } from "./project-access";

export const memberService = {
  async list(projectId: string, userId: string): Promise<MemberDto[]> {
    await requireProjectRole(projectId, userId);
    const members = await projectRepository.listMembers(projectId);
    return members.map(toMemberDto);
  },

  /**
   * Adds an existing account to the project by username. Owner only; the new member has the role `MEMBER`.
   *
   * @throws AppError `USERNAME_NOT_FOUND` when no active account has that username.
   * @throws AppError `ALREADY_A_MEMBER` when the user is already in the project.
   */
  async add(projectId: string, ownerId: string, username: string): Promise<MemberDto> {
    await requireProjectRole(projectId, ownerId, "OWNER");

    const target = await userRepository.findByUsername(username.trim().toLowerCase());
    if (!target || !target.isActive) throw new AppError("USERNAME_NOT_FOUND");

    try {
      return toMemberDto(await projectRepository.addMember(projectId, target.id, "MEMBER"));
    } catch (error) {
      // Two owners adding the same person at once: the second insert hits the primary key.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("ALREADY_A_MEMBER");
      }
      throw error;
    }
  },

  /**
   * Removes a member. Owner only. The member's threads are kept.
   *
   * @throws AppError `OWNER_CANNOT_LEAVE` when the target is the owner.
   */
  async remove(projectId: string, ownerId: string, memberUserId: string): Promise<void> {
    await requireProjectRole(projectId, ownerId, "OWNER");
    const target = await projectRepository.findMembership(projectId, memberUserId);
    if (!target) throw new AppError("USERNAME_NOT_FOUND");
    if (target.role === "OWNER") throw new AppError("OWNER_CANNOT_LEAVE");
    await projectRepository.removeMember(projectId, memberUserId);
  },
};
