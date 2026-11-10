import { addMemberSchema } from "@/model/project/project.schema";
import { created, ok } from "@/server/http/api-response";
import { readJson } from "@/server/http/parse-body";
import { withApiHandler } from "@/server/http/with-api-handler";
import { memberService } from "@/server/services/member-service";

type Params = { projectId: string };

export const GET = withApiHandler<Params>(async ({ params, user }) =>
  ok(await memberService.list(params.projectId, user.id)),
);

/** Owner only: adds an existing account by username. */
export const POST = withApiHandler<Params>(async ({ request, params, user }) => {
  const { username } = await readJson(request, addMemberSchema);
  return created(await memberService.add(params.projectId, user.id, username));
});
