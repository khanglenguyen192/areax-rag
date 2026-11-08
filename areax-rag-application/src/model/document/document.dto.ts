export type DocumentKind = "FILE" | "YOUTUBE";

export type DocumentStatus = "PROCESSING" | "READY" | "FAILED";

export type DocumentDto = {
  readonly id: string;
  /** File name, or the video title once known and the URL before that. */
  readonly name: string;
  readonly kind: DocumentKind;
  /** Size in bytes; 0 for a YouTube source. */
  readonly sizeBytes: number;
  readonly status: DocumentStatus;
  /** Failure reason (for example `NO_TEXT_LAYER`), set only when `status` is `FAILED`. */
  readonly failureCode: string | null;
  readonly createdAt: string;
};

export type DocumentListDto = {
  readonly items: readonly DocumentDto[];
  readonly usedBytes: number;
  readonly limitBytes: number;
  readonly fileMaxBytes: number;
};

export type RequestUploadInput = {
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly contentType: string;
};

export type UploadSlotDto = {
  readonly documentId: string;
  /** Presigned URL the browser sends the file to. */
  readonly uploadUrl: string;
};

export type AddYoutubeInput = {
  readonly url: string;
};
