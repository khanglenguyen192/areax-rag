import "server-only";
import { AppError } from "@/server/errors/app-error";
import { userRepository } from "@/server/repositories/user-repository";
import { auth } from "./auth";

export type AuthenticatedUser = {
  readonly id: string;
  readonly username: string;
};

/**
 * Returns the signed-in user, loaded from Postgres.
 *
 * The session only proves who the caller is; the account is re-read here so a deactivated user
 * loses access immediately instead of when the token expires.
 *
 * @throws AppError `UNAUTHENTICATED` when there is no session or the account is inactive.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new AppError("UNAUTHENTICATED");

  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) throw new AppError("UNAUTHENTICATED");
  return { id: user.id, username: user.username };
}
