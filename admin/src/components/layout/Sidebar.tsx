"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import { LogoutIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import type { AdminUser } from "@/lib/auth-user";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({
  user,
  open,
  onClose,
}: {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  // Close the mobile overlay on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <>
      {/* Backdrop — only below lg, only when the overlay is open */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-white",
          "transform transition-transform duration-200 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-6 py-6 mx-auto">
          <Logo variant="dark" size="md" />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-white",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-field px-2 py-2">
            <Avatar name={user.firstName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.firstName}</p>
              <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
