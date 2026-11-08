import { useContext } from "react";
import { SessionContext } from "@/components/providers/session-context";
import type { UserDto } from "@/model/auth/auth.dto";

/** Returns the signed-in user. Only valid below `MainShell`, which loads the session once. */
export function useCurrentUser(): UserDto {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useCurrentUser must be used inside MainShell");
  return user;
}
