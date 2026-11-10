import { noContent } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { memberService } from "@/server/services/member-service";

type Params = { projectId: string; memberId: string };

/** Owner only. */
export const DELETE = withApiHandler<Params>(async ({ params, user }) => {
  await memberService.remove(params.projectId, user.id, params.memberId);
  return noContent();
});
