import { loginSchema } from "@/model/auth/auth.schema";
import type { UserDto } from "@/model/auth/auth.dto";
import { getDb, MOCK_PASSWORD } from "../mock-db";
import { mockFail, mockNoContent, mockOk } from "../mock-response";
import { currentUser, matchPath, writeSessionUsername, type MockHandler } from "./mock-context";

export const handleAuth: MockHandler = ({ method, path, body }) => {
  if (method === "POST" && matchPath(path, "/api/auth/login")) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return mockFail(
        400,
        "VALIDATION_FAILED",
        parsed.error.issues.map((issue) => ({ field: String(issue.path[0]), code: issue.message })),
      );
    }
    const user = getDb().users.find(
      (candidate) => candidate.username === parsed.data.username.toLowerCase(),
    );
    // Same code for an unknown user and a wrong password, as the real endpoint does.
    if (!user || parsed.data.password !== MOCK_PASSWORD)
      return mockFail(401, "INVALID_CREDENTIALS");
    writeSessionUsername(user.username);
    return mockOk<UserDto>({ id: user.id, username: user.username });
  }

  if (method === "POST" && matchPath(path, "/api/auth/logout")) {
    writeSessionUsername(null);
    return mockNoContent();
  }

  if (method === "GET" && matchPath(path, "/api/auth/me")) {
    const user = currentUser();
    return user
      ? mockOk<UserDto>({ id: user.id, username: user.username })
      : mockFail(401, "UNAUTHENTICATED");
  }

  return null;
};
