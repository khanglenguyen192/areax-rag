import type { ApiFieldError, ApiResponse } from "@/model/api/api-response.dto";

const STATUS_CODES: Record<number, string> = { 200: "OK", 201: "CREATED", 204: "OK" };

function envelope<T>(
  status: number,
  code: string,
  extra: { data?: T; errors?: readonly ApiFieldError[] } = {},
): ApiResponse<T> {
  return {
    status,
    code,
    message: code,
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

export const mockOk = <T>(data: T, status = 200) =>
  envelope(status, STATUS_CODES[status] ?? "OK", { data });
export const mockNoContent = () => envelope(204, "OK");
export const mockFail = (status: number, code: string, errors?: readonly ApiFieldError[]) =>
  envelope(status, code, { errors });
