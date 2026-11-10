import "server-only";
import type { Document, DocumentKind, DocumentStatus, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";

export type NewDocument = {
  readonly projectId: string;
  readonly uploadedById: string;
  readonly name: string;
  readonly kind: DocumentKind;
  readonly sizeBytes: number;
  readonly status: DocumentStatus;
  readonly storageKey?: string;
  readonly sourceUrl?: string;
};

export const documentRepository = {
  listByProject: (projectId: string): Promise<Document[]> =>
    getPrisma().document.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),

  find: (projectId: string, documentId: string): Promise<Document | null> =>
    getPrisma().document.findFirst({ where: { id: documentId, projectId } }),

  listStorageKeys: async (projectId: string): Promise<string[]> => {
    const rows = await getPrisma().document.findMany({
      where: { projectId, storageKey: { not: null } },
      select: { storageKey: true },
    });
    return rows.flatMap((row) => (row.storageKey ? [row.storageKey] : []));
  },

  /**
   * Checks the size limit and inserts the row in one transaction that holds a lock on the project
   * row, so two uploads started at the same time cannot both squeeze under the limit.
   */
  createWithinLimit: (input: NewDocument, limitBytes: number): Promise<Document | null> =>
    getPrisma().$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$queryRaw`SELECT id FROM projects WHERE id = ${input.projectId} FOR UPDATE`;
      const used = await tx.document.aggregate({
        where: { projectId: input.projectId },
        _sum: { sizeBytes: true },
      });
      if ((used._sum.sizeBytes ?? 0) + input.sizeBytes > limitBytes) return null;
      return tx.document.create({ data: input });
    }),

  create: (input: NewDocument): Promise<Document> => getPrisma().document.create({ data: input }),

  sumBytes: async (projectId: string): Promise<number> => {
    const used = await getPrisma().document.aggregate({
      where: { projectId },
      _sum: { sizeBytes: true },
    });
    return used._sum.sizeBytes ?? 0;
  },

  setStorageKey: async (documentId: string, storageKey: string): Promise<void> => {
    await getPrisma().document.update({ where: { id: documentId }, data: { storageKey } });
  },

  markProcessing: (documentId: string): Promise<Document> =>
    getPrisma().document.update({ where: { id: documentId }, data: { status: "PROCESSING" } }),

  delete: async (documentId: string): Promise<void> => {
    await getPrisma().document.delete({ where: { id: documentId } });
  },
};
