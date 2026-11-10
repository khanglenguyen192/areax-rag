import { createProjectSchema } from "@/model/project/project.schema";
import { created, ok } from "@/server/http/api-response";
import { readJson } from "@/server/http/parse-body";
import { withApiHandler } from "@/server/http/with-api-handler";
import { projectService } from "@/server/services/project-service";

export const GET = withApiHandler(async ({ user }) => ok(await projectService.list(user.id)));

export const POST = withApiHandler(async ({ request, user }) => {
  const input = await readJson(request, createProjectSchema);
  return created(await projectService.create(user.id, input));
});
