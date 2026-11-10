import { noContent } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { documentService } from "@/server/services/document-service";

type Params = { projectId: string; documentId: string };

/** Any member may delete a document. */
export const DELETE = withApiHandler<Params>(async ({ params, user, requestId }) => {
  await documentService.delete(params.projectId, user.id, params.documentId, requestId);
  return noContent();
});
