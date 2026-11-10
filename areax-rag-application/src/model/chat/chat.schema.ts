import { z } from "zod";

export const MESSAGE_MAX = 4000;

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "REQUIRED").max(MESSAGE_MAX, "TOO_LONG"),
});

export const createThreadSchema = z.object({
  title: z.string().trim().max(120, "TOO_LONG").optional(),
});
