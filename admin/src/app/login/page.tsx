"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/Logo";
import { Badge, Button, Field, Input } from "@/components/ui";
import { useLoginMutation } from "@/services/auth/auth.queries";
import { loginSchema, type LoginInput } from "@/schemas/auth/login.schema";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { emailOrPhone: "", password: "" },
  });

  const loginMutation = useLoginMutation();

  const onSubmit = handleSubmit((values) => loginMutation.mutate(values));

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Decorative background blobs (match the login mockup) */}
      <div className="pointer-events-none absolute -left-24 -top-16 size-72 rounded-full bg-blue-100/50" />
      <div className="pointer-events-none absolute right-10 top-10 size-56 rounded-full bg-slate-200/40" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 size-72 rounded-full bg-emerald-100/50" />
      <div className="pointer-events-none absolute bottom-10 left-16 size-40 rounded-full bg-slate-200/40" />

      <div className="relative w-full max-w-md rounded-card border border-line bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col items-center text-center">
          <Logo variant="light" size="md" />
          <Badge tone="green" dot className="mt-4">
            Admin Portal
          </Badge>
          <h1 className="mt-4 text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to manage your platform
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
          <Field
            label="Email address"
            htmlFor="emailOrPhone"
            error={errors.emailOrPhone?.message}
          >
            <Input
              id="emailOrPhone"
              type="text"
              autoComplete="username"
              placeholder="admin@supracarer.com"
              {...register("emailOrPhone")}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            hint={
              <button
                type="button"
                className="text-xs font-medium text-brand hover:underline"
              >
                Forgot password?
              </button>
            }
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
          </Field>

          {loginMutation.isError && (
            <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
              {loginMutation.error.message}
            </p>
          )}

          <Button type="submit" fullWidth loading={loginMutation.isPending}>
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-faint">
          For access issues contact your system administrator
        </p>
      </div>
    </main>
  );
}
