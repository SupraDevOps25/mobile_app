"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/Logo";
import { Badge, Button, Field, Input, PasswordInput } from "@/components/ui";
import {
  useForgotPassword,
  useLoginMutation,
  useResetPassword,
} from "@/services/auth/auth.queries";
import { loginSchema, type LoginInput } from "@/schemas/auth/login.schema";
import {
  forgotSchema,
  resetSchema,
  type ForgotInput,
  type ResetInput,
} from "@/schemas/auth/reset.schema";

type View = "signin" | "forgot" | "reset";

export default function LoginPage() {
  const [view, setView] = useState<View>("signin");
  // Carried from the "forgot" step into the "reset" step (which account).
  const [resetIdentifier, setResetIdentifier] = useState("");
  // A one-off banner shown above the sign-in form (e.g. after a reset).
  const [notice, setNotice] = useState<string | null>(null);

  const heading =
    view === "signin"
      ? { title: "Welcome back", subtitle: "Sign in to manage your platform" }
      : view === "forgot"
        ? {
            title: "Reset your password",
            subtitle: "We'll email you a 6-digit code",
          }
        : {
            title: "Enter your code",
            subtitle: "Check your email for the 6-digit code",
          };

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
          <h1 className="mt-4 text-2xl font-bold text-ink">{heading.title}</h1>
          <p className="mt-1 text-sm text-muted">{heading.subtitle}</p>
        </div>

        {view === "signin" && (
          <SignInForm
            notice={notice}
            onForgot={() => {
              setNotice(null);
              setView("forgot");
            }}
          />
        )}

        {view === "forgot" && (
          <ForgotForm
            onSent={(id) => {
              setResetIdentifier(id);
              setView("reset");
            }}
            onBack={() => setView("signin")}
          />
        )}

        {view === "reset" && (
          <ResetForm
            emailOrPhone={resetIdentifier}
            onDone={() => {
              setNotice(
                "Password updated. Sign in with your new password.",
              );
              setView("signin");
            }}
            onBack={() => setView("forgot")}
          />
        )}

        <p className="mt-6 text-center text-xs text-faint">
          For access issues contact your system administrator
        </p>
      </div>
    </main>
  );
}

// A small text link used for "Forgot password?" / "Back to sign in".
function LinkButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-medium text-brand hover:underline"
    >
      {children}
    </button>
  );
}

function SignInForm({
  notice,
  onForgot,
}: {
  notice: string | null;
  onForgot: () => void;
}) {
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
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      {notice && (
        <p className="rounded-field bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      )}

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
        hint={<LinkButton onClick={onForgot}>Forgot password?</LinkButton>}
      >
        <PasswordInput
          id="password"
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
  );
}

function ForgotForm({
  onSent,
  onBack,
}: {
  onSent: (emailOrPhone: string) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { emailOrPhone: "" },
  });

  const forgotMutation = useForgotPassword();
  const onSubmit = handleSubmit((values) =>
    // The API always resolves generically, so on success we move on regardless.
    forgotMutation.mutate(values, {
      onSuccess: () => onSent(values.emailOrPhone),
    }),
  );

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      <Field
        label="Email or phone"
        htmlFor="forgotIdentifier"
        error={errors.emailOrPhone?.message}
      >
        <Input
          id="forgotIdentifier"
          type="text"
          autoComplete="username"
          placeholder="admin@supracarer.com"
          {...register("emailOrPhone")}
        />
      </Field>

      {forgotMutation.isError && (
        <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
          {forgotMutation.error.message}
        </p>
      )}

      <Button type="submit" fullWidth loading={forgotMutation.isPending}>
        Send reset code
      </Button>

      <div className="text-center">
        <LinkButton onClick={onBack}>Back to sign in</LinkButton>
      </div>
    </form>
  );
}

function ResetForm({
  emailOrPhone,
  onDone,
  onBack,
}: {
  emailOrPhone: string;
  onDone: () => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const resetMutation = useResetPassword();
  const onSubmit = handleSubmit((values) =>
    resetMutation.mutate(
      {
        emailOrPhone,
        code: values.code,
        newPassword: values.newPassword,
      },
      { onSuccess: onDone },
    ),
  );

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      <p className="rounded-field bg-blue-50 px-3 py-2 text-sm text-blue-700">
        If an account exists for <strong>{emailOrPhone}</strong>, a 6-digit code
        was sent. It expires in 15 minutes.
      </p>

      <Field label="Reset code" htmlFor="code" error={errors.code?.message}>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          {...register("code")}
        />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        error={errors.newPassword?.message}
      >
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register("newPassword")}
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          {...register("confirmPassword")}
        />
      </Field>

      {resetMutation.isError && (
        <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
          {resetMutation.error.message}
        </p>
      )}

      <Button type="submit" fullWidth loading={resetMutation.isPending}>
        Set new password
      </Button>

      <div className="text-center">
        <LinkButton onClick={onBack}>Use a different account</LinkButton>
      </div>
    </form>
  );
}
