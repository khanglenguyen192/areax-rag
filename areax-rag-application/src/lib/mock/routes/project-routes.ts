import type { Page } from "@/model/api/api-response.dto";
import type { MemberDto } from "@/model/project/member.dto";
import type { ProjectDetailDto, ProjectDto } from "@/model/project/project.dto";
import {
  addMemberSchema,
  createProjectSchema,
  updatePromptSchema,
} from "@/model/project/project.schema";
import { getDb, nextId, type MockProject } from "../mock-db";
import { mockFail, mockNoContent, mockOk } from "../mock-response";
import {
  currentUser,
  matchPath,
  requireProject,
  roleIn,
  type MockContext,
  type MockHandler,
} from "./mock-context";

function toProjectDto(project: MockProject, userId: string): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    role: roleIn(project, userId) ?? "MEMBER",
    memberCount: project.members.length,
    documentCount: project.documents.length,
    createdAt: project.createdAt,
  };
}

function fieldErrors(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}) {
  return error.issues.map((issue) => ({ field: String(issue.path[0]), code: issue.message }));
}

function listProjects() {
  const user = currentUser();
  if (!user) return mockFail(401, "UNAUTHENTICATED");
  const items = getDb()
    .projects.filter((project) => roleIn(project, user.id))
    .map((project) => toProjectDto(project, user.id));
  const page: Page<ProjectDto> = { items, page: 1, pageSize: items.length, total: items.length };
  return mockOk(page);
}

function createProject({ body }: MockContext) {
  const user = currentUser();
  if (!user) return mockFail(401, "UNAUTHENTICATED");
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return mockFail(400, "VALIDATION_FAILED", fieldErrors(parsed.error));
  const now = new Date().toISOString();
  const project: MockProject = {
    id: nextId("p"),
    name: parsed.data.name,
    description: parsed.data.description || null,
    prompt: "",
    createdAt: now,
    members: [{ userId: user.id, role: "OWNER", joinedAt: now }],
    documents: [],
  };
  getDb().projects.push(project);
  return mockOk(toProjectDto(project, user.id), 201);
}

function listMembers(project: MockProject) {
  const users = getDb().users;
  const items: MemberDto[] = project.members.flatMap((member) => {
    const user = users.find((candidate) => candidate.id === member.userId);
    return user
      ? [{ id: user.id, username: user.username, role: member.role, joinedAt: member.joinedAt }]
      : [];
  });
  return mockOk(items);
}

function addMember(project: MockProject, role: string, body: unknown) {
  if (role !== "OWNER") return mockFail(403, "FORBIDDEN");
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) return mockFail(400, "VALIDATION_FAILED", fieldErrors(parsed.error));
  const target = getDb().users.find((user) => user.username === parsed.data.username.toLowerCase());
  if (!target) return mockFail(404, "USERNAME_NOT_FOUND");
  if (roleIn(project, target.id)) return mockFail(409, "ALREADY_A_MEMBER");
  const joinedAt = new Date().toISOString();
  project.members.push({ userId: target.id, role: "MEMBER", joinedAt });
  return mockOk<MemberDto>(
    { id: target.id, username: target.username, role: "MEMBER", joinedAt },
    201,
  );
}

function removeMember(project: MockProject, role: string, memberId: string) {
  if (role !== "OWNER") return mockFail(403, "FORBIDDEN");
  const member = project.members.find((candidate) => candidate.userId === memberId);
  if (!member) return mockFail(404, "USERNAME_NOT_FOUND");
  if (member.role === "OWNER") return mockFail(422, "OWNER_CANNOT_LEAVE");
  project.members = project.members.filter((candidate) => candidate !== member);
  return mockNoContent();
}

export const handleProjects: MockHandler = (context) => {
  const { method, path, body } = context;

  if (matchPath(path, "/api/projects")) {
    if (method === "GET") return listProjects();
    if (method === "POST") return createProject(context);
  }

  const detail = matchPath(path, "/api/projects/:projectId");
  if (detail) {
    const access = requireProject(detail.projectId ?? "");
    if (!access.ok) return access.response;
    if (method === "GET") {
      const dto: ProjectDetailDto = {
        ...toProjectDto(access.project, access.user.id),
        prompt: access.project.prompt,
      };
      return mockOk(dto);
    }
    if (method === "DELETE") {
      if (access.role !== "OWNER") return mockFail(403, "FORBIDDEN");
      const db = getDb();
      db.projects = db.projects.filter((project) => project !== access.project);
      return mockNoContent();
    }
  }

  const prompt = matchPath(path, "/api/projects/:projectId/prompt");
  if (prompt && method === "PUT") {
    const access = requireProject(prompt.projectId ?? "");
    if (!access.ok) return access.response;
    const parsed = updatePromptSchema.safeParse(body);
    if (!parsed.success) return mockFail(400, "VALIDATION_FAILED", fieldErrors(parsed.error));
    access.project.prompt = parsed.data.prompt;
    return mockOk({ prompt: access.project.prompt });
  }

  const leave = matchPath(path, "/api/projects/:projectId/leave");
  if (leave && method === "POST") {
    const access = requireProject(leave.projectId ?? "");
    if (!access.ok) return access.response;
    if (access.role === "OWNER") return mockFail(422, "OWNER_CANNOT_LEAVE");
    access.project.members = access.project.members.filter(
      (member) => member.userId !== access.user.id,
    );
    return mockNoContent();
  }

  const members = matchPath(path, "/api/projects/:projectId/members");
  if (members) {
    const access = requireProject(members.projectId ?? "");
    if (!access.ok) return access.response;
    if (method === "GET") return listMembers(access.project);
    if (method === "POST") return addMember(access.project, access.role, body);
  }

  const member = matchPath(path, "/api/projects/:projectId/members/:memberId");
  if (member && method === "DELETE") {
    const access = requireProject(member.projectId ?? "");
    if (!access.ok) return access.response;
    return removeMember(access.project, access.role, member.memberId ?? "");
  }

  return null;
};
