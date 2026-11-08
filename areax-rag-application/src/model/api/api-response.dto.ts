/** A validation error attached to one input field. */
export type ApiFieldError = {
  readonly field: string;
  readonly code: string;
};

/**
 * The envelope every API returns, success or error.
 * Keep in sync with section 18 of CODING_STANDARD.md and the server helpers.
 */
export type ApiResponse<T = unknown> = {
  readonly status: number;
  readonly code: string;
  /** For debugging only; never shown to users. */
  readonly message: string;
  readonly requestId: string;
  readonly timestamp: string;
  readonly data?: T;
  readonly errors?: readonly ApiFieldError[];
};

export type Page<T> = {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
};
