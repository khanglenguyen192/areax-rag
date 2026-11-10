import type { ApiFieldError } from "@/model/api/api-response.dto";
import { ERROR_STATUS, type ErrorCode } from "./codes";

/** The only error services throw on purpose; the API wrapper turns it into an `ApiResponse`. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors: readonly ApiFieldError[];

  constructor(code: ErrorCode, fieldErrors: readonly ApiFieldError[] = []) {
    super(code);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.fieldErrors = fieldErrors;
  }
}
