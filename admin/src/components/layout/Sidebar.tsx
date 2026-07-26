"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import { LogoutIcon } from "@/components/icons";
import { logout } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-sidebar text-white">
      <div className="px-6 py-6">
        <Logo variant="dark" size="md" />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
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
        <div className="flex items-center gap-3 rounded-[10px] px-2 py-2">
          <Avatar name={`${user.firstName}`} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.firstName}</p>
            <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogoutIcon size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
