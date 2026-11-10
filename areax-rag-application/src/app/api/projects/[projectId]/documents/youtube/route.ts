import { addYoutubeSchema } from "@/model/document/document.schema";
import { created } from "@/server/http/api-response";
import { readJson } from "@/server/http/parse-body";
import { withApiHandler } from "@/server/http/with-api-handler";
import { documentService } from "@/server/services/document-service";

type Params = { projectId: string };

export const POST = withApiHandler<Params>(async ({ request, params, user, requestId }) => {
  const { url } = await readJson(request, addYoutubeSchema);
  return created(await documentService.addYoutube(params.projectId, user.id, url, requestId));
});
