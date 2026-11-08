import { z } from "zod";

export const PROJECT_NAME_MAX = 80;
export const PROJECT_DESCRIPTION_MAX = 300;
export const PROMPT_MAX = 4000;

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "REQUIRED").max(PROJECT_NAME_MAX, "TOO_LONG"),
  description: z.string().trim().max(PROJECT_DESCRIPTION_MAX, "TOO_LONG").optional(),
});

export const updatePromptSchema = z.object({
  prompt: z.string().max(PROMPT_MAX, "TOO_LONG"),
});

export const addMemberSchema = z.object({
  username: z.string().trim().min(1, "REQUIRED"),
});
