import { sendMessageSchema } from "@/model/chat/chat.schema";
import { created, ok } from "@/server/http/api-response";
import { readJson } from "@/server/http/parse-body";
import { withApiHandler } from "@/server/http/with-api-handler";
import { threadService } from "@/server/services/thread-service";

type Params = { threadId: string };

export const GET = withApiHandler<Params>(async ({ params, user }) =>
  ok(await threadService.listMessages(params.threadId, user.id)),
);

/** Saves the question and starts the answer; the answer streams over `/api/events`. */
export const POST = withApiHandler<Params>(async ({ request, params, user, requestId }) => {
  const { content } = await readJson(request, sendMessageSchema);
  return created(await threadService.sendMessage(params.threadId, user.id, content, requestId));
});
