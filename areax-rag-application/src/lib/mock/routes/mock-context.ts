import type { ApiResponse } from "@/model/api/api-response.dto";
import type { ProjectRole } from "@/model/project/project.dto";
import { getDb, type MockProject, type MockUser } from "../mock-db";
import { mockFail } from "../mock-response";

export type MockContext = {
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
};

/** Returns a response when the route is handled, or `null` to let the next handler try. */
export type MockHandler = (context: MockContext) => ApiResponse | null;

const COOKIE_NAME = "areax_mock_user";

/** Mock sessions live in a cookie so a refresh keeps you signed in; real sessions are Auth.js cookies. */
export function readSessionUsername(): string | null {
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)) : null;
}

export function writeSessionUsername(username: string | null): void {
  document.cookie =
    username === null
      ? `${COOKIE_NAME}=; Max-Age=0; Path=/`
      : `${COOKIE_NAME}=${encodeURIComponent(username)}; Path=/; SameSite=Lax`;
}

export function currentUser(): MockUser | null {
  const username = readSessionUsername();
  return getDb().users.find((user) => user.username === username) ?? null;
}

export function matchPath(path: string, pattern: string): Record<string, string> | null {
  const names: string[] = [];
  const source = pattern.replace(/:(\w+)/g, (_match, name: string) => {
    names.push(name);
    return "([^/]+)";
  });
  const found = new RegExp(`^${source}$`).exec(path);
  if (!found) return null;
  return Object.fromEntries(names.map((name, index) => [name, found[index + 1] ?? ""]));
}

export function roleIn(project: MockProject, userId: string): ProjectRole | null {
  return project.members.find((member) => member.userId === userId)?.role ?? null;
}

type ProjectAccess =
  | { ok: true; user: MockUser; project: MockProject; role: ProjectRole }
  | { ok: false; response: ApiResponse };

/** Mirrors the server rule: a non-member sees the project as missing, not as forbidden. */
export function requireProject(projectId: string): ProjectAccess {
  const user = currentUser();
  if (!user) return { ok: false, response: mockFail(401, "UNAUTHENTICATED") };
  const project = getDb().projects.find((candidate) => candidate.id === projectId);
  const role = project ? roleIn(project, user.id) : null;
  if (!project || !role) return { ok: false, response: mockFail(404, "PROJECT_NOT_FOUND") };
  return { ok: true, user, project, role };
}

export function asRecord(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
}
