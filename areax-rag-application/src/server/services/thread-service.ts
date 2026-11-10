import "server-only";
import type { Thread } from "@/generated/prisma/client";
import type { MessageDto, SendMessageResultDto, ThreadDto } from "@/model/chat/chat.dto";
import { AppError } from "@/server/errors/app-error";
import { publishers } from "@/server/kafka/publishers";
import { toMessageDto, toThreadDto } from "@/server/model/mappers";
import { threadRepository } from "@/server/repositories/thread-repository";
import { requireProjectRole } from "./project-access";

const TITLE_MAX = 40;

/**
 * Loads a thread the caller owns and is still allowed to open.
 *
 * A thread is private to its owner, even from the project owner. It is also hidden while the
 * owner is not a member of the project, and reappears when they are added back.
 */
async function requireOwnThread(threadId: string, userId: string): Promise<Thread> {
  const thread = await threadRepository.findOwned(threadId, userId);
  if (!thread) throw new AppError("THREAD_NOT_FOUND");
  try {
    await requireProjectRole(thread.projectId, userId);
  } catch (error) {
    if (error instanceof AppError && error.code === "PROJECT_NOT_FOUND")
      throw new AppError("THREAD_NOT_FOUND");
    throw error;
  }
  return thread;
}

export const threadService = {
  /** Lists only the caller's own threads in the project. */
  async list(projectId: string, userId: string): Promise<ThreadDto[]> {
    await requireProjectRole(projectId, userId);
    return (await threadRepository.listForOwner(projectId, userId)).map(toThreadDto);
  },

  async create(projectId: string, userId: string, title: string | undefined): Promise<ThreadDto> {
    await requireProjectRole(projectId, userId);
    return toThreadDto(await threadRepository.create(projectId, userId, title?.trim() ?? ""));
  },

  async delete(threadId: string, userId: string): Promise<void> {
    const thread = await requireOwnThread(threadId, userId);
    await threadRepository.delete(thread.id);
  },

  async listMessages(threadId: string, userId: string): Promise<MessageDto[]> {
    const thread = await requireOwnThread(threadId, userId);
    return (await threadRepository.listMessages(thread.id)).map(toMessageDto);
  },

  /**
   * Saves the question and an empty answer, then asks the chat service to answer through Kafka.
   * The answer arrives as tokens over SSE and is saved by the chat service when it finishes.
   *
   * @throws AppError `THREAD_NOT_FOUND` when the thread is not the caller's.
   * @throws AppError `UPSTREAM_ERROR` when Kafka is unreachable; the pending answer is marked failed.
   */
  async sendMessage(
    threadId: string,
    userId: string,
    content: string,
    requestId: string,
  ): Promise<SendMessageResultDto> {
    const thread = await requireOwnThread(threadId, userId);
    const { question, answer } = await threadRepository.createQuestionAndPendingAnswer(
      thread.id,
      content,
    );
    await threadRepository.setTitleIfEmpty(thread.id, content.slice(0, TITLE_MAX));
    await threadRepository.touch(thread.id);

    try {
      await publishers.chatRequested(requestId, thread.projectId, {
        threadId: thread.id,
        messageId: answer.id,
        userId,
        question: content,
      });
    } catch (error) {
      await threadRepository.markMessageFailed(answer.id, "UPSTREAM_ERROR");
      throw error;
    }
    return { userMessage: toMessageDto(question), assistantMessage: toMessageDto(answer) };
  },
};
