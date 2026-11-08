import type { DocumentDto, DocumentListDto, UploadSlotDto } from "@/model/document/document.dto";
import { SUPPORTED_EXTENSIONS, addYoutubeSchema } from "@/model/document/document.schema";
import {
  MOCK_FILE_LIMIT_BYTES,
  MOCK_PROCESSING_MS,
  MOCK_PROJECT_LIMIT_BYTES,
  nextId,
  type MockDocument,
  type MockProject,
} from "../mock-db";
import { mockFail, mockNoContent, mockOk } from "../mock-response";
import { asRecord, matchPath, requireProject, type MockHandler } from "./mock-context";

const YOUTUBE_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{6,}/;

function toDto(document: MockDocument): DocumentDto {
  const isProcessing = !document.isUploaded || Date.now() - document.createdAt < MOCK_PROCESSING_MS;
  const status = document.failureCode ? "FAILED" : isProcessing ? "PROCESSING" : "READY";
  return {
    id: document.id,
    name: document.name,
    kind: document.kind,
    sizeBytes: document.sizeBytes,
    status,
    failureCode: document.failureCode,
    createdAt: new Date(document.createdAt || Date.now() - 86_400_000).toISOString(),
  };
}

function usedBytes(project: MockProject): number {
  return project.documents.reduce((sum, document) => sum + document.sizeBytes, 0);
}

function list(project: MockProject) {
  const dto: DocumentListDto = {
    items: project.documents.map(toDto),
    usedBytes: usedBytes(project),
    limitBytes: MOCK_PROJECT_LIMIT_BYTES,
    fileMaxBytes: MOCK_FILE_LIMIT_BYTES,
  };
  return mockOk(dto);
}

function requestUpload(project: MockProject, body: unknown) {
  const { fileName, sizeBytes } = asRecord(body);
  if (typeof fileName !== "string" || typeof sizeBytes !== "number") {
    return mockFail(400, "VALIDATION_FAILED", [{ field: "fileName", code: "REQUIRED" }]);
  }
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(extension))
    return mockFail(422, "UNSUPPORTED_FILE_TYPE");
  if (sizeBytes > MOCK_FILE_LIMIT_BYTES) return mockFail(413, "FILE_TOO_LARGE");
  if (usedBytes(project) + sizeBytes > MOCK_PROJECT_LIMIT_BYTES)
    return mockFail(422, "PROJECT_SIZE_LIMIT_EXCEEDED");
  const document: MockDocument = {
    id: nextId("d"),
    name: fileName,
    kind: "FILE",
    sizeBytes,
    createdAt: Date.now(),
    failureCode: null,
    isUploaded: false,
  };
  project.documents.push(document);
  return mockOk<UploadSlotDto>(
    { documentId: document.id, uploadUrl: `mock://upload/${document.id}` },
    201,
  );
}

function addYoutube(project: MockProject, body: unknown) {
  const parsed = addYoutubeSchema.safeParse(body);
  if (!parsed.success)
    return mockFail(400, "VALIDATION_FAILED", [{ field: "url", code: "REQUIRED" }]);
  if (!YOUTUBE_PATTERN.test(parsed.data.url)) return mockFail(422, "INVALID_YOUTUBE_URL");
  const document: MockDocument = {
    id: nextId("d"),
    name: parsed.data.url,
    kind: "YOUTUBE",
    sizeBytes: 0,
    createdAt: Date.now(),
    failureCode: null,
    isUploaded: true,
  };
  project.documents.push(document);
  return mockOk(toDto(document), 201);
}

export const handleDocuments: MockHandler = ({ method, path, body }) => {
  const collection = matchPath(path, "/api/projects/:projectId/documents");
  if (collection) {
    const access = requireProject(collection.projectId ?? "");
    if (!access.ok) return access.response;
    if (method === "GET") return list(access.project);
  }

  const upload = matchPath(path, "/api/projects/:projectId/documents/upload");
  if (upload && method === "POST") {
    const access = requireProject(upload.projectId ?? "");
    return access.ok ? requestUpload(access.project, body) : access.response;
  }

  const youtube = matchPath(path, "/api/projects/:projectId/documents/youtube");
  if (youtube && method === "POST") {
    const access = requireProject(youtube.projectId ?? "");
    return access.ok ? addYoutube(access.project, body) : access.response;
  }

  const complete = matchPath(path, "/api/projects/:projectId/documents/:documentId/complete");
  if (complete && method === "POST") {
    const access = requireProject(complete.projectId ?? "");
    if (!access.ok) return access.response;
    const document = access.project.documents.find(
      (candidate) => candidate.id === complete.documentId,
    );
    if (!document) return mockFail(404, "DOCUMENT_NOT_FOUND");
    document.isUploaded = true;
    document.createdAt = Date.now();
    return mockOk(toDto(document));
  }

  const item = matchPath(path, "/api/projects/:projectId/documents/:documentId");
  if (item && method === "DELETE") {
    const access = requireProject(item.projectId ?? "");
    if (!access.ok) return access.response;
    const before = access.project.documents.length;
    access.project.documents = access.project.documents.filter(
      (document) => document.id !== item.documentId,
    );
    return access.project.documents.length === before
      ? mockFail(404, "DOCUMENT_NOT_FOUND")
      : mockNoContent();
  }

  return null;
};
