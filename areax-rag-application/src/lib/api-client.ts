import type { ApiResponse } from "@/model/api/api-response.dto";
import { ApiError, isAbortError } from "./api-error";

const LOGIN_PATH = "/login";
const AUTH_PATH_PREFIX = "/api/auth/login";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  readonly body?: unknown;
  readonly signal?: AbortSignal;
};

async function send(method: Method, path: string, options: RequestOptions): Promise<ApiResponse> {
  if (USE_MOCK) {
    // Dynamic import keeps the mock server out of the production bundle: the flag is inlined at build.
    const { handleMockRequest } = await import("./mock/mock-router");
    return handleMockRequest(method, path, options.body, options.signal);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      cache: "no-store",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (caught) {
    if (isAbortError(caught)) throw caught;
    throw new ApiError(0, "NETWORK_ERROR", "Network request failed");
  }

  // 204 has no body: the real server sends it after a delete.
  if (response.status === 204) {
    return {
      status: 204,
      code: "OK",
      message: "OK",
      requestId: response.headers.get("X-Request-Id") ?? "",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return (await response.json()) as ApiResponse;
  } catch {
    // The body is not our envelope (a proxy error page, for example): report it as a server fault.
    throw new ApiError(response.status, "INTERNAL_ERROR", "Response was not valid JSON");
  }
}

async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await send(method, path, options);

  if (envelope.status >= 400) {
    // A 401 anywhere except the login call means the session is gone: send the user to sign in.
    if (
      envelope.status === 401 &&
      !path.startsWith(AUTH_PATH_PREFIX) &&
      typeof window !== "undefined"
    ) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full page load drops all signed-in client state
      window.location.assign(LOGIN_PATH);
    }
    throw new ApiError(envelope.status, envelope.code, envelope.message, envelope.errors);
  }
  return envelope.data as T;
}

/**
 * The only way the browser talks to the server. Every call goes to our own `/api/**` routes,
 * unwraps the `ApiResponse` envelope and throws `ApiError` when `status >= 400`.
 */
export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, { signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>("POST", path, { body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>("PUT", path, { body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>("PATCH", path, { body, signal }),
  delete: <T = void>(path: string, signal?: AbortSignal) => request<T>("DELETE", path, { signal }),
};
