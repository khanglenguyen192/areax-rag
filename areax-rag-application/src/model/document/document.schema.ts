import { z } from "zod";

export const addYoutubeSchema = z.object({
  url: z.string().trim().min(1, "REQUIRED"),
});

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "md", "txt"] as const;

export const FILE_NAME_MAX = 200;

export const requestUploadSchema = z.object({
  fileName: z.string().trim().min(1, "REQUIRED").max(FILE_NAME_MAX, "TOO_LONG"),
  sizeBytes: z.number().int().positive("REQUIRED"),
  contentType: z.string().max(200).default(""),
});
