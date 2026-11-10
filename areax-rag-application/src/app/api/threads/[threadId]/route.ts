import { noContent } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { threadService } from "@/server/services/thread-service";

type Params = { threadId: string };

export const DELETE = withApiHandler<Params>(async ({ params, user }) => {
  await threadService.delete(params.threadId, user.id);
  return noContent();
});
