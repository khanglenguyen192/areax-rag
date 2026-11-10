import "server-only";
import { CredentialsSignin } from "next-auth";
import type { LoginInput, UserDto } from "@/model/auth/auth.dto";
import { signIn, signOut } from "@/server/auth/auth";
import { loginRateLimit } from "@/server/auth/login-rate-limit";
import { AppError } from "@/server/errors/app-error";
import { userRepository } from "@/server/repositories/user-repository";

export const authService = {
  /**
   * Signs a user in and sets the session cookie.
   *
   * Failures are limited per username rather than per address: the application is reached directly,
   * so a forwarded-for header cannot be trusted. An unknown username and a wrong password return
   * the same code.
   *
   * @throws AppError `INVALID_CREDENTIALS` for a wrong username or password.
   * @throws AppError `RATE_LIMITED` after too many failures for the username.
   */
  async login(input: LoginInput): Promise<UserDto> {
    const normalized = input.username.trim().toLowerCase();
    loginRateLimit.assertAllowed(normalized);

    try {
      await signIn("credentials", {
        username: input.username,
        password: input.password,
        redirect: false,
      });
    } catch (error) {
      // Only a rejected login counts as wrong credentials. Any other Auth.js error (for example the
      // database being down inside `authorize`) is a server fault and must not look like a typo.
      if (error instanceof CredentialsSignin) {
        loginRateLimit.recordFailure(normalized);
        throw new AppError("INVALID_CREDENTIALS");
      }
      throw error;
    }

    loginRateLimit.clear(normalized);
    const user = await userRepository.findByUsername(normalized);
    if (!user) throw new AppError("INVALID_CREDENTIALS");
    return { id: user.id, username: user.username };
  },

  async logout(): Promise<void> {
    await signOut({ redirect: false });
  },
};
