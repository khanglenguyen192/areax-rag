import { ok } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { documentService } from "@/server/services/document-service";

type Params = { projectId: string; documentId: string };

/** Step 2 of an upload: the browser confirms the file is in storage. */
export const POST = withApiHandler<Params>(async ({ params, user, requestId }) =>
  ok(await documentService.completeUpload(params.projectId, user.id, params.documentId, requestId)),
);
