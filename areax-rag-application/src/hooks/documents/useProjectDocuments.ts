import { useCallback, useEffect } from "react";
import { useAsyncAction } from "@/hooks/common/useAsyncAction";
import { useAsyncData, type AsyncData } from "@/hooks/common/useAsyncData";
import { apiClient } from "@/lib/api-client";
import { uploadToPresignedUrl } from "@/lib/upload-client";
import type { DocumentListDto, UploadSlotDto } from "@/model/document/document.dto";

const POLL_INTERVAL_MS = 2500;

export type ProjectDocuments = AsyncData<DocumentListDto> & {
  readonly upload: (file: File) => Promise<true | undefined>;
  readonly isUploading: boolean;
  readonly uploadError: unknown;
  readonly addYoutube: (url: string) => Promise<true | undefined>;
  readonly isAddingYoutube: boolean;
  readonly youtubeError: unknown;
  readonly resetYoutubeError: () => void;
  readonly remove: (documentId: string) => Promise<true | undefined>;
  readonly removeError: unknown;
};

/** Lists a project's documents and handles upload, YouTube sources and deletion. */
export function useProjectDocuments(projectId: string, enabled = true): ProjectDocuments {
  const base = `/api/projects/${projectId}/documents`;
  const load = useCallback(
    (signal: AbortSignal) => apiClient.get<DocumentListDto>(base, signal),
    [base],
  );
  const state = useAsyncData(load, enabled);
  const { data, refetch } = state;

  const hasProcessing = data?.items.some((document) => document.status === "PROCESSING") ?? false;
  useEffect(() => {
    if (!hasProcessing) return undefined;
    // Status changes are written by the background services, so poll until nothing is processing.
    const timer = setInterval(() => void refetch(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasProcessing, refetch]);

  const uploadRequest = useCallback(
    async (file: File) => {
      try {
        const slot = await apiClient.post<UploadSlotDto>(`${base}/upload`, {
          fileName: file.name,
          sizeBytes: file.size,
          contentType: file.type,
        });
        await uploadToPresignedUrl(slot.uploadUrl, file);
        await apiClient.post(`${base}/${slot.documentId}/complete`);
        return true as const;
      } finally {
        await refetch();
      }
    },
    [base, refetch],
  );
  const youtubeRequest = useCallback(
    async (url: string) => {
      try {
        await apiClient.post(`${base}/youtube`, { url });
        return true as const;
      } finally {
        await refetch();
      }
    },
    [base, refetch],
  );
  const removeRequest = useCallback(
    async (documentId: string) => {
      try {
        await apiClient.delete(`${base}/${documentId}`);
        return true as const;
      } finally {
        await refetch();
      }
    },
    [base, refetch],
  );

  const uploading = useAsyncAction(uploadRequest);
  const youtube = useAsyncAction(youtubeRequest);
  const removing = useAsyncAction(removeRequest);

  return {
    ...state,
    upload: uploading.run,
    isUploading: uploading.isRunning,
    uploadError: uploading.error,
    addYoutube: youtube.run,
    isAddingYoutube: youtube.isRunning,
    youtubeError: youtube.error,
    resetYoutubeError: youtube.reset,
    remove: removing.run,
    removeError: removing.error,
  };
}
