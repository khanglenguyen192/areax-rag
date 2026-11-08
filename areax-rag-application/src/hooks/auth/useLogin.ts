import { useCallback } from "react";
import { useAsyncAction } from "@/hooks/common/useAsyncAction";
import { apiClient } from "@/lib/api-client";
import type { LoginInput, UserDto } from "@/model/auth/auth.dto";

/** Signs in with a username and password. */
export function useLogin() {
  const login = useCallback(
    (input: LoginInput) => apiClient.post<UserDto>("/api/auth/login", input),
    [],
  );
  return useAsyncAction(login);
}
