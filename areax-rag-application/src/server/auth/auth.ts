import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/model/auth/auth.schema";
import { getEnv } from "@/server/config/env";
import { userRepository } from "@/server/repositories/user-repository";
import { verifyPassword } from "./password";

const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60;

/**
 * Auth.js with the Credentials provider. The session is a signed JWT that only identifies the user;
 * it carries no permissions, which are checked against Postgres on every request.
 *
 * The configuration is a function so it runs on first use, not when `next build` imports the module.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  secret: getEnv().AUTH_SECRET,
  // The app runs behind plain HTTP on a host name or address we do not know in advance.
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_S },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await userRepository.findByUsername(parsed.data.username.toLowerCase());
        const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? null);
        if (!user || !user.isActive || !valid) return null;
        return { id: user.id, name: user.username };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (typeof token.userId === "string") session.user.id = token.userId;
      return session;
    },
  },
}));
