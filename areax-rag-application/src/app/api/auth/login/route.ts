import { loginSchema } from "@/model/auth/auth.schema";
import { ok } from "@/server/http/api-response";
import { readJson } from "@/server/http/parse-body";
import { withPublicApiHandler } from "@/server/http/with-api-handler";
import { authService } from "@/server/services/auth-service";

/** Signs in with a username and password and sets the session cookie. No session is required. */
export const POST = withPublicApiHandler(async ({ request }) => {
  const input = await readJson(request, loginSchema);
  return ok(await authService.login(input));
});
