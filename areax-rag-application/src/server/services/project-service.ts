import "server-only";
import type { Page } from "@/model/api/api-response.dto";
import type { CreateProjectInput, ProjectDetailDto, ProjectDto } from "@/model/project/project.dto";
import { AppError } from "@/server/errors/app-error";
import { logger } from "@/server/http/logger";
import { publishers } from "@/server/kafka/publishers";
import { toProjectDetailDto, toProjectDto } from "@/server/model/mappers";
import { projectRepository } from "@/server/repositories/project-repository";
import { storage } from "@/server/s3/storage";
import { requireProjectRole } from "./project-access";

export const projectKeyPrefix = (projectId: string) => `projects/${projectId}/`;

export const projectService = {
  /** Lists the projects the user belongs to, newest membership first. */
  async list(userId: string): Promise<Page<ProjectDto>> {
    const memberships = await projectRepository.listMembershipsForUser(userId);
    const items = memberships.map((membership) =>
      toProjectDto(membership.project, membership.role),
    );
    return { items, page: 1, pageSize: items.length, total: items.length };
  },

  async create(userId: string, input: CreateProjectInput): Promise<ProjectDto> {
    const project = await projectRepository.create(
      userId,
      input.name.trim(),
      input.description?.trim() || null,
    );
    return toProjectDto(project, "OWNER");
  },

  /** @throws AppError `PROJECT_NOT_FOUND` when the project is missing or the user is not a member. */
  async get(projectId: string, userId: string): Promise<ProjectDetailDto> {
    const membership = await requireProjectRole(projectId, userId);
    const project = await projectRepository.findWithCounts(projectId);
    if (!project) throw new AppError("PROJECT_NOT_FOUND");
    return toProjectDetailDto(project, membership.role);
  },

  /** Every member may edit the one prompt of the project. */
  async updatePrompt(
    projectId: string,
    userId: string,
    prompt: string,
  ): Promise<{ prompt: string }> {
    await requireProjectRole(projectId, userId);
    return projectRepository.updatePrompt(projectId, prompt);
  },

  /**
   * Deletes a project with its documents, threads and members. Owner only.
   *
   * The rows are deleted first. The files and the vectors are removed afterwards (a Kafka message
   * tells the ingestion service); a failure there is logged but does not undo the delete, because
   * the project is already gone for its users.
   *
   * @throws AppError `FORBIDDEN` when the caller is not the owner.
   */
  async delete(projectId: string, userId: string, requestId: string): Promise<void> {
    await requireProjectRole(projectId, userId, "OWNER");
    await projectRepository.delete(projectId);
    try {
      await storage.deletePrefix(projectKeyPrefix(projectId));
      await publishers.projectDeleted(requestId, projectId);
    } catch (error) {
      logger.warn("Project cleanup after delete failed", {
        requestId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  /**
   * Removes the caller from the project. Their threads stay, so they come back if the user is added again.
   *
   * @throws AppError `OWNER_CANNOT_LEAVE` when the caller is the owner.
   */
  async leave(projectId: string, userId: string): Promise<void> {
    const membership = await requireProjectRole(projectId, userId);
    if (membership.role === "OWNER") throw new AppError("OWNER_CANNOT_LEAVE");
    await projectRepository.removeMember(projectId, userId);
  },
};
