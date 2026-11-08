"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/organisms";
import { AuthLayout } from "@/components/templates";
import { useLogin } from "@/hooks/auth/useLogin";
import { useT } from "@/hooks/common/useT";
import { describeError, describeFieldErrors } from "@/lib/describe-error";
import type { LoginInput } from "@/model/auth/auth.dto";

export function LoginView() {
  const t = useT();
  const router = useRouter();
  const login = useLogin();

  const handleSubmit = async (input: LoginInput) => {
    const user = await login.run(input);
    if (user) router.replace("/home");
  };

  return (
    <AuthLayout>
      <LoginForm
        isSubmitting={login.isRunning}
        errorMessage={login.error ? describeError(login.error, t) : undefined}
        fieldErrors={describeFieldErrors(login.error, t)}
        onSubmit={(input) => void handleSubmit(input)}
      />
    </AuthLayout>
  );
}
