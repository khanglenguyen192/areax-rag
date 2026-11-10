import "server-only";
import type { User } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";

export const userRepository = {
  findById: (id: string): Promise<User | null> => getPrisma().user.findUnique({ where: { id } }),

  findByUsername: (normalizedUsername: string): Promise<User | null> =>
    getPrisma().user.findUnique({ where: { usernameNormalized: normalizedUsername } }),
};
