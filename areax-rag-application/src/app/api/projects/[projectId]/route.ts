import { noContent, ok } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { projectService } from "@/server/services/project-service";

type Params = { projectId: string };

export const GET = withApiHandler<Params>(async ({ params, user }) =>
  ok(await projectService.get(params.projectId, user.id)),
);

/** Owner only. */
export const DELETE = withApiHandler<Params>(async ({ params, user, requestId }) => {
  await projectService.delete(params.projectId, user.id, requestId);
  return noContent();
});
