import type { ApiFieldError } from "@/model/api/api-response.dto";

/** Thrown by `apiClient` for every failed request; carries the stable error `code`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: readonly ApiFieldError[];

  constructor(
    status: number,
    code: string,
    message: string,
    errors: readonly ApiFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** Returns true when the request was cancelled on purpose (unmount, input change). */
export function isAbortError(value: unknown): boolean {
  return value instanceof DOMException && value.name === "AbortError";
}
