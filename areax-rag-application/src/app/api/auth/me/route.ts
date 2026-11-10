import { ok } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

/** Returns the signed-in user. A missing or invalid session answers 401. */
export const GET = withApiHandler(async ({ user }) => ok({ id: user.id, username: user.username }));
