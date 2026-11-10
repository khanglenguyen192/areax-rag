import { createThreadSchema } from "@/model/chat/chat.schema";
import { created, ok } from "@/server/http/api-response";
import { readOptionalJson } from "@/server/http/parse-body";
import { withApiHandler } from "@/server/http/with-api-handler";
import { threadService } from "@/server/services/thread-service";

type Params = { projectId: string };

/** The caller's own threads only. */
export const GET = withApiHandler<Params>(async ({ params, user }) =>
  ok(await threadService.list(params.projectId, user.id)),
);

export const POST = withApiHandler<Params>(async ({ request, params, user }) => {
  const { title } = await readOptionalJson(request, createThreadSchema);
  return created(await threadService.create(params.projectId, user.id, title));
});
