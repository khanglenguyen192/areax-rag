import type { DocumentKind } from "@/model/document/document.dto";
import type { MessageStatus } from "@/model/chat/chat.dto";
import type { ProjectRole } from "@/model/project/project.dto";

/**
 * In-memory data for the mock API, used only when NEXT_PUBLIC_USE_MOCK_API=true.
 * The accounts and passwords here are fixtures for local development, never real credentials.
 */
export const MOCK_PASSWORD = "password";
export const MOCK_PROJECT_LIMIT_BYTES = 100 * 1024 * 1024;
export const MOCK_FILE_LIMIT_BYTES = 50 * 1024 * 1024;
export const MOCK_PROCESSING_MS = 4000;

export type MockUser = { id: string; username: string };
export type MockMember = { userId: string; role: ProjectRole; joinedAt: string };
export type MockDocument = {
  id: string;
  name: string;
  kind: DocumentKind;
  sizeBytes: number;
  createdAt: number;
  failureCode: string | null;
  isUploaded: boolean;
};
export type MockProject = {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  createdAt: string;
  members: MockMember[];
  documents: MockDocument[];
};
export type MockThread = {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  updatedAt: string;
};
export type MockMessage = {
  id: string;
  threadId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  status: MessageStatus;
  failureCode: string | null;
  createdAt: string;
};

export type MockDb = {
  users: MockUser[];
  projects: MockProject[];
  threads: MockThread[];
  messages: MockMessage[];
  sequence: number;
};

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function seed(): MockDb {
  return {
    sequence: 100,
    users: [
      { id: "u-alice", username: "alice" },
      { id: "u-bob", username: "bob" },
      { id: "u-carol", username: "carol" },
    ],
    projects: [
      {
        id: "p-research",
        name: "Product research",
        description: "Interview notes and competitor reports.",
        prompt: "Answer briefly and name the document you used.",
        createdAt: ago(60 * 24 * 9),
        members: [
          { userId: "u-alice", role: "OWNER", joinedAt: ago(60 * 24 * 9) },
          { userId: "u-bob", role: "MEMBER", joinedAt: ago(60 * 24 * 5) },
        ],
        documents: [
          {
            id: "d-1",
            name: "interviews-q3.pdf",
            kind: "FILE",
            sizeBytes: 4_200_000,
            createdAt: 0,
            failureCode: null,
            isUploaded: true,
          },
          {
            id: "d-2",
            name: "competitors.docx",
            kind: "FILE",
            sizeBytes: 1_300_000,
            createdAt: 0,
            failureCode: null,
            isUploaded: true,
          },
          {
            id: "d-3",
            name: "scanned-contract.pdf",
            kind: "FILE",
            sizeBytes: 9_800_000,
            createdAt: 0,
            failureCode: "NO_TEXT_LAYER",
            isUploaded: true,
          },
        ],
      },
      {
        id: "p-reading",
        name: "Reading notes",
        description: null,
        prompt: "",
        createdAt: ago(60 * 24 * 2),
        members: [
          { userId: "u-bob", role: "OWNER", joinedAt: ago(60 * 24 * 2) },
          { userId: "u-alice", role: "MEMBER", joinedAt: ago(60 * 24) },
        ],
        documents: [],
      },
    ],
    threads: [
      {
        id: "t-1",
        projectId: "p-research",
        ownerId: "u-alice",
        title: "Key findings",
        updatedAt: ago(30),
      },
    ],
    messages: [
      {
        id: "m-1",
        threadId: "t-1",
        role: "USER",
        content: "What were the main findings?",
        status: "DONE",
        failureCode: null,
        createdAt: ago(31),
      },
      {
        id: "m-2",
        threadId: "t-1",
        role: "ASSISTANT",
        content: "Interviewees most often mentioned slow onboarding and unclear pricing.",
        status: "DONE",
        failureCode: null,
        createdAt: ago(30),
      },
    ],
  };
}

const globalStore = globalThis as typeof globalThis & { __areaxMockDb?: MockDb };

/** Returns the shared store; kept on `globalThis` so hot reload does not reset it. */
export function getDb(): MockDb {
  globalStore.__areaxMockDb ??= seed();
  return globalStore.__areaxMockDb;
}

export function nextId(prefix: string): string {
  const db = getDb();
  db.sequence += 1;
  return `${prefix}-${db.sequence}`;
}
