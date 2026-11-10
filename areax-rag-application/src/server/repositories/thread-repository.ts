import "server-only";
import type { Message, Thread } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";

export const threadRepository = {
  listForOwner: (projectId: string, ownerId: string): Promise<Thread[]> =>
    getPrisma().thread.findMany({ where: { projectId, ownerId }, orderBy: { updatedAt: "desc" } }),

  create: (projectId: string, ownerId: string, title: string): Promise<Thread> =>
    getPrisma().thread.create({ data: { projectId, ownerId, title } }),

  /** Returns the thread only when `ownerId` owns it: nobody else may read or write a thread. */
  findOwned: (threadId: string, ownerId: string): Promise<Thread | null> =>
    getPrisma().thread.findFirst({ where: { id: threadId, ownerId } }),

  findOwnerId: async (threadId: string): Promise<string | null> => {
    const row = await getPrisma().thread.findUnique({
      where: { id: threadId },
      select: { ownerId: true },
    });
    return row?.ownerId ?? null;
  },

  setTitleIfEmpty: async (threadId: string, title: string): Promise<void> => {
    await getPrisma().thread.updateMany({ where: { id: threadId, title: "" }, data: { title } });
  },

  touch: async (threadId: string): Promise<void> => {
    await getPrisma().thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
  },

  delete: async (threadId: string): Promise<void> => {
    await getPrisma().thread.delete({ where: { id: threadId } });
  },

  listMessages: (threadId: string): Promise<Message[]> =>
    getPrisma().message.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } }),

  /** Saves the question and an empty, streaming answer together. The answer fills in as tokens arrive. */
  createQuestionAndPendingAnswer: (
    threadId: string,
    question: string,
  ): Promise<{ question: Message; answer: Message }> =>
    getPrisma().$transaction(async (tx) => {
      // Explicit times, one millisecond apart: rows written in one transaction would otherwise share
      // a timestamp and the question could sort after its own answer.
      const now = Date.now();
      const questionRow = await tx.message.create({
        data: {
          threadId,
          role: "USER",
          content: question,
          status: "DONE",
          createdAt: new Date(now),
        },
      });
      const answerRow = await tx.message.create({
        data: {
          threadId,
          role: "ASSISTANT",
          content: "",
          status: "STREAMING",
          createdAt: new Date(now + 1),
        },
      });
      return { question: questionRow, answer: answerRow };
    }),

  markMessageFailed: async (messageId: string, failureCode: string): Promise<void> => {
    await getPrisma().message.update({
      where: { id: messageId },
      data: { status: "FAILED", failureCode },
    });
  },
};
