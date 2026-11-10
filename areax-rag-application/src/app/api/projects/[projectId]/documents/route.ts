import { ok } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { documentService } from "@/server/services/document-service";

type Params = { projectId: string };

export const GET = withApiHandler<Params>(async ({ params, user }) =>
  ok(await documentService.list(params.projectId, user.id)),
);
