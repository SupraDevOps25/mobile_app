"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Badge, Button, Field, Input } from "@/components/ui";
import { getToken } from "@/lib/api";
import { login, userFromToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    const u = userFromToken(getToken());
    if (u?.role === "ADMIN") router.replace("/");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Decorative background blobs (match the login mockup) */}
      <div className="pointer-events-none absolute -left-24 -top-16 size-72 rounded-full bg-blue-100/50" />
      <div className="pointer-events-none absolute right-10 top-10 size-56 rounded-full bg-slate-200/40" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 size-72 rounded-full bg-emerald-100/50" />
      <div className="pointer-events-none absolute bottom-10 left-16 size-40 rounded-full bg-slate-200/40" />

      <div className="relative w-full max-w-md rounded-card border border-line bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col items-center text-center">
          <Logo variant="light" size="lg" />
          <Badge tone="green" dot className="mt-4">
            Admin Portal
          </Badge>
          <h1 className="mt-4 text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to manage your platform
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <Field label="Email address" htmlFor="email">
            <Input
              id="email"
              type="text"
              autoComplete="username"
              placeholder="admin@supracarer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          {error && (
            <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth loading={loading}>
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
