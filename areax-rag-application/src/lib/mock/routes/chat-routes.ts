import type { MessageDto, SendMessageResultDto, ThreadDto } from "@/model/chat/chat.dto";
import { sendMessageSchema } from "@/model/chat/chat.schema";
import { getDb, nextId, type MockMessage, type MockThread } from "../mock-db";
import { mockFail, mockNoContent, mockOk } from "../mock-response";
import { simulateAnswer } from "../mock-stream";
import { asRecord, currentUser, matchPath, requireProject, type MockHandler } from "./mock-context";

const toThreadDto = (thread: MockThread): ThreadDto => ({
  id: thread.id,
  title: thread.title,
  updatedAt: thread.updatedAt,
});

const toMessageDto = (message: MockMessage): MessageDto => ({ ...message });

/** A thread is visible only to the user who owns it, even for the project owner. */
function ownThread(threadId: string): MockThread | null {
  const user = currentUser();
  const thread = getDb().threads.find((candidate) => candidate.id === threadId);
  if (!user || !thread || thread.ownerId !== user.id) return null;
  const project = getDb().projects.find((candidate) => candidate.id === thread.projectId);
  // A removed member keeps their threads but cannot open them until added back.
  return project?.members.some((member) => member.userId === user.id) ? thread : null;
}

function sendMessage(thread: MockThread, body: unknown) {
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return mockFail(400, "VALIDATION_FAILED", [
      { field: "content", code: parsed.error.issues[0]?.message ?? "REQUIRED" },
    ]);
  }
  const now = new Date().toISOString();
  const userMessage: MockMessage = {
    id: nextId("m"),
    threadId: thread.id,
    role: "USER",
    content: parsed.data.content,
    status: "DONE",
    failureCode: null,
    createdAt: now,
  };
  const assistantMessage: MockMessage = {
    id: nextId("m"),
    threadId: thread.id,
    role: "ASSISTANT",
    content: "",
    status: "STREAMING",
    failureCode: null,
    createdAt: now,
  };
  getDb().messages.push(userMessage, assistantMessage);
  thread.updatedAt = now;
  if (thread.title === "") thread.title = parsed.data.content.slice(0, 40);
  simulateAnswer(thread.id, assistantMessage.id, parsed.data.content);
  const result: SendMessageResultDto = {
    userMessage: toMessageDto(userMessage),
    assistantMessage: toMessageDto(assistantMessage),
  };
  return mockOk(result, 201);
}

export const handleChat: MockHandler = ({ method, path, body }) => {
  const threads = matchPath(path, "/api/projects/:projectId/threads");
  if (threads) {
    const access = requireProject(threads.projectId ?? "");
    if (!access.ok) return access.response;
    if (method === "GET") {
      const items = getDb()
        .threads.filter(
          (thread) => thread.projectId === access.project.id && thread.ownerId === access.user.id,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(toThreadDto);
      return mockOk(items);
    }
    if (method === "POST") {
      const title = asRecord(body).title;
      const thread: MockThread = {
        id: nextId("t"),
        projectId: access.project.id,
        ownerId: access.user.id,
        title: typeof title === "string" ? title : "",
        updatedAt: new Date().toISOString(),
      };
      getDb().threads.push(thread);
      return mockOk(toThreadDto(thread), 201);
    }
  }

  const single = matchPath(path, "/api/threads/:threadId");
  if (single && method === "DELETE") {
    const thread = ownThread(single.threadId ?? "");
    if (!thread) return mockFail(404, "THREAD_NOT_FOUND");
    const db = getDb();
    db.threads = db.threads.filter((candidate) => candidate !== thread);
    db.messages = db.messages.filter((message) => message.threadId !== thread.id);
    return mockNoContent();
  }

  const messages = matchPath(path, "/api/threads/:threadId/messages");
  if (messages) {
    const thread = ownThread(messages.threadId ?? "");
    if (!thread) return mockFail(404, "THREAD_NOT_FOUND");
    if (method === "GET") {
      return mockOk(
        getDb()
          .messages.filter((message) => message.threadId === thread.id)
          .map(toMessageDto),
      );
    }
    if (method === "POST") return sendMessage(thread, body);
  }

  return null;
};
