import { z } from "zod";

export const addYoutubeSchema = z.object({
  url: z.string().trim().min(1, "REQUIRED"),
});

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "md", "txt"] as const;
