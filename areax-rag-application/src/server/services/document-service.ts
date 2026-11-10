import "server-only";
import type { Document } from "@/generated/prisma/client";
import type {
  DocumentDto,
  DocumentListDto,
  RequestUploadInput,
  UploadSlotDto,
} from "@/model/document/document.dto";
import { SUPPORTED_EXTENSIONS } from "@/model/document/document.schema";
import { getEnv } from "@/server/config/env";
import { AppError } from "@/server/errors/app-error";
import { logger } from "@/server/http/logger";
import { publishers } from "@/server/kafka/publishers";
import { toDocumentDto } from "@/server/model/mappers";
import { documentRepository } from "@/server/repositories/document-repository";
import { storage } from "@/server/s3/storage";
import { requireProjectRole } from "./project-access";
import { projectKeyPrefix } from "./project-service";

const YOUTUBE_PATTERN = /^https?:\/\/(www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{6,}/;

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  md: "text/markdown",
  txt: "text/plain",
};

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

/** Keeps the key readable but safe: no path separators, no spaces, bounded length. */
function safeFileName(fileName: string): string {
  return fileName.replace(/[^A-Za-z0-9._-]/g, "_").slice(-120);
}

function storageKeyFor(projectId: string, documentId: string, fileName: string): string {
  return `${projectKeyPrefix(projectId)}documents/${documentId}/${safeFileName(fileName)}`;
}

async function findFileOrThrow(projectId: string, documentId: string): Promise<Document> {
  const document = await documentRepository.find(projectId, documentId);
  if (!document || document.kind !== "FILE") throw new AppError("DOCUMENT_NOT_FOUND");
  return document;
}

export const documentService = {
  async list(projectId: string, userId: string): Promise<DocumentListDto> {
    await requireProjectRole(projectId, userId);
    const env = getEnv();
    const documents = await documentRepository.listByProject(projectId);
    return {
      items: documents.map(toDocumentDto),
      usedBytes: documents.reduce((sum, document) => sum + document.sizeBytes, 0),
      limitBytes: env.PROJECT_MAX_TOTAL_BYTES,
      fileMaxBytes: env.FILE_MAX_BYTES,
    };
  },

  /**
   * Step 1 of an upload: checks permission, file type and both size limits, records the document
   * as pending, and returns a presigned URL the browser sends the file to.
   *
   * @throws AppError `UNSUPPORTED_FILE_TYPE`, `FILE_TOO_LARGE` or `PROJECT_SIZE_LIMIT_EXCEEDED`.
   */
  async requestUpload(
    projectId: string,
    userId: string,
    input: RequestUploadInput,
  ): Promise<UploadSlotDto> {
    await requireProjectRole(projectId, userId);
    const env = getEnv();

    if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(extensionOf(input.fileName))) {
      throw new AppError("UNSUPPORTED_FILE_TYPE");
    }
    if (input.sizeBytes > env.FILE_MAX_BYTES) throw new AppError("FILE_TOO_LARGE");

    const document = await documentRepository.createWithinLimit(
      {
        projectId,
        uploadedById: userId,
        name: input.fileName,
        kind: "FILE",
        sizeBytes: input.sizeBytes,
        status: "PENDING_UPLOAD",
      },
      env.PROJECT_MAX_TOTAL_BYTES,
    );
    if (!document) throw new AppError("PROJECT_SIZE_LIMIT_EXCEEDED");

    const storageKey = storageKeyFor(projectId, document.id, input.fileName);
    await documentRepository.setStorageKey(document.id, storageKey);
    return {
      documentId: document.id,
      uploadUrl: await storage.presignUpload(storageKey, input.sizeBytes),
    };
  },

  /**
   * Step 2: the browser says the upload finished. The real size is read from S3 and must match what
   * was declared, then the ingestion service is told to process the file.
   *
   * @throws AppError `UPLOAD_NOT_FOUND` when no object exists, or its size differs from the declared one.
   */
  async completeUpload(
    projectId: string,
    userId: string,
    documentId: string,
    requestId: string,
  ): Promise<DocumentDto> {
    await requireProjectRole(projectId, userId);
    const document = await findFileOrThrow(projectId, documentId);
    if (document.status !== "PENDING_UPLOAD") return toDocumentDto(document);
    if (!document.storageKey) throw new AppError("UPLOAD_NOT_FOUND");

    const storedSize = await storage.headSize(document.storageKey);
    if (storedSize !== document.sizeBytes) {
      // Missing or a different size: drop the row (and any partial object) so it does not count against the limit.
      if (storedSize !== null) await storage.deleteObject(document.storageKey);
      await documentRepository.delete(document.id);
      throw new AppError("UPLOAD_NOT_FOUND");
    }

    const processing = await documentRepository.markProcessing(document.id);
    await publishers.documentUploaded(requestId, projectId, {
      documentId: document.id,
      storageKey: document.storageKey,
      fileName: document.name,
      contentType: CONTENT_TYPES[extensionOf(document.name)] ?? "application/octet-stream",
      sizeBytes: document.sizeBytes,
    });
    return toDocumentDto(processing);
  },

  /** Adds a YouTube video as a source; the ingestion service fetches its captions. */
  async addYoutube(
    projectId: string,
    userId: string,
    url: string,
    requestId: string,
  ): Promise<DocumentDto> {
    await requireProjectRole(projectId, userId);
    if (!YOUTUBE_PATTERN.test(url)) throw new AppError("INVALID_YOUTUBE_URL");

    const document = await documentRepository.create({
      projectId,
      uploadedById: userId,
      name: url,
      kind: "YOUTUBE",
      sizeBytes: 0,
      status: "PROCESSING",
      sourceUrl: url,
    });
    await publishers.youtubeSourceAdded(requestId, projectId, { documentId: document.id, url });
    return toDocumentDto(document);
  },

  /** Any member may delete a document. Removes the row, then the file, and asks ingestion to drop its vectors. */
  async delete(
    projectId: string,
    userId: string,
    documentId: string,
    requestId: string,
  ): Promise<void> {
    await requireProjectRole(projectId, userId);
    const document = await documentRepository.find(projectId, documentId);
    if (!document) throw new AppError("DOCUMENT_NOT_FOUND");

    await documentRepository.delete(document.id);
    try {
      if (document.storageKey) await storage.deleteObject(document.storageKey);
      await publishers.documentDeleted(requestId, projectId, { documentId: document.id });
    } catch (error) {
      // The row is already gone, so the user's view is right; leftovers are cleaned by the services.
      logger.warn("Document cleanup after delete failed", {
        requestId,
        documentId: document.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
