import { updatePromptSchema } from "@/model/project/project.schema";
import { ok } from "@/server/http/api-response";
import { readJson } from "@/server/http/parse-body";
import { withApiHandler } from "@/server/http/with-api-handler";
import { projectService } from "@/server/services/project-service";

type Params = { projectId: string };

export const PUT = withApiHandler<Params>(async ({ request, params, user }) => {
  const { prompt } = await readJson(request, updatePromptSchema);
  return ok(await projectService.updatePrompt(params.projectId, user.id, prompt));
});
