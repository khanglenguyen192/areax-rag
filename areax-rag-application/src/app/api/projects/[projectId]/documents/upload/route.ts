import { requestUploadSchema } from "@/model/document/document.schema";
import { created } from "@/server/http/api-response";
import { readJson } from "@/server/http/parse-body";
import { withApiHandler } from "@/server/http/with-api-handler";
import { documentService } from "@/server/services/document-service";

type Params = { projectId: string };

/** Step 1 of an upload: validates the file and returns a presigned URL. */
export const POST = withApiHandler<Params>(async ({ request, params, user }) => {
  const input = await readJson(request, requestUploadSchema);
  return created(await documentService.requestUpload(params.projectId, user.id, input));
});
