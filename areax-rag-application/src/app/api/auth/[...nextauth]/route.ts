import { handlers } from "@/server/auth/auth";

// Auth.js's own endpoints (session, CSRF). The UI uses /api/auth/login, /logout and /me instead.
export const { GET, POST } = handlers;
