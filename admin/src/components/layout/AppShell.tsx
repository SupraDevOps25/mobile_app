"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/components/ui";
import { useRequireAdmin } from "@/lib/useRequireAdmin";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// The protected dashboard shell: fixed navy sidebar + sticky topbar + scrolling
// content. Guards every page beneath it — holds a spinner until the admin check
// resolves, then redirects non-admins to /login.
export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready } = useRequireAdmin();

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <div className="pl-64">
        <Topbar user={user} />
        <main className="mx-auto max-w-7xl p-6">{children}</main>
      </div>
    </div>
  );
}
