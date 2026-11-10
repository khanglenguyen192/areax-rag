import { noContent } from "@/server/http/api-response";
import { withPublicApiHandler } from "@/server/http/with-api-handler";
import { authService } from "@/server/services/auth-service";

/** Ends the session. Safe to call without one. */
export const POST = withPublicApiHandler(async () => {
  await authService.logout();
  return noContent();
});
