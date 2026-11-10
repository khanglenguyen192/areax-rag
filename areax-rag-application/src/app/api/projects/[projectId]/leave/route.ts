import { noContent } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { projectService } from "@/server/services/project-service";

type Params = { projectId: string };

export const POST = withApiHandler<Params>(async ({ params, user }) => {
  await projectService.leave(params.projectId, user.id);
  return noContent();
});
