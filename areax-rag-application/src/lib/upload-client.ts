import { ApiError, isAbortError } from "./api-error";

const MOCK_UPLOAD_PREFIX = "mock://";
const MOCK_UPLOAD_DELAY_MS = 700;

/**
 * Sends a file to a presigned URL issued by the API.
 *
 * This is the one place the browser talks to something other than our own `/api/**` routes: the
 * presigned URL points at object storage so large files never pass through the app server.
 */
export async function uploadToPresignedUrl(
  url: string,
  file: File,
  signal?: AbortSignal,
): Promise<void> {
  if (url.startsWith(MOCK_UPLOAD_PREFIX)) {
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_UPLOAD_DELAY_MS));
    return;
  }
  try {
    const response = await fetch(url, { method: "PUT", body: file, signal });
    if (!response.ok) throw new ApiError(response.status, "INTERNAL_ERROR", "Upload was rejected");
  } catch (caught) {
    if (isAbortError(caught) || caught instanceof ApiError) throw caught;
    throw new ApiError(0, "NETWORK_ERROR", "Upload failed");
  }
}
