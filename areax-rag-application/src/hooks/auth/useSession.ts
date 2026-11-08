import { useCallback } from "react";
import { useAsyncData, type AsyncData } from "@/hooks/common/useAsyncData";
import { apiClient } from "@/lib/api-client";
import type { UserDto } from "@/model/auth/auth.dto";

export type Session = AsyncData<UserDto> & {
  /** Ends the session and sends the browser to the login page. */
  readonly signOut: () => Promise<void>;
};

/** Loads the signed-in user. A `401` makes `apiClient` redirect to the login page. */
export function useSession(): Session {
  const load = useCallback(
    (signal: AbortSignal) => apiClient.get<UserDto>("/api/auth/me", signal),
    [],
  );
  const state = useAsyncData(load);

  const signOut = useCallback(async () => {
    await apiClient.post("/api/auth/logout");
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full page load drops all signed-in client state
    window.location.assign("/login");
  }, []);

  return { ...state, signOut };
}
