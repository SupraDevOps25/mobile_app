"use client";

import { useState, type ReactNode } from "react";
import { Spinner } from "@/components/ui";
import { useRequireAdmin } from "@/lib/useRequireAdmin";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// The protected dashboard shell: navy sidebar + sticky topbar + scrolling
// content. Guards every page beneath it — holds a spinner until the admin check
// resolves, then redirects non-admins to /login.
//
// Responsive: the sidebar is static from `lg` up (content is padded left);
// below `lg` it collapses to a slide-in overlay toggled by the topbar's
// hamburger. `open` only matters on small screens — `lg:translate-x-0` keeps it
// visible regardless on large ones.
export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready } = useRequireAdmin();
  const [open, setOpen] = useState(false);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <Topbar user={user} onMenuClick={() => setOpen(true)} />
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
