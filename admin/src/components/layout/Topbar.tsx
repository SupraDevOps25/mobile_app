"use client";

import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui";
import { BellIcon, SearchIcon } from "@/components/icons";
import type { AdminUser } from "@/lib/auth";
import { NAV_ITEMS } from "./nav";

// Derive the page title from the active nav route so we don't have to thread a
// title prop through every page. Detail routes (e.g. /caregivers/:id) keep the
// section's title via startsWith matching.
function titleFor(pathname: string): string {
  const match = [...NAV_ITEMS]
    .filter((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Supracarer";
}

export function Topbar({ user }: { user: AdminUser }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-line bg-white px-6">
      <h2 className="text-lg font-bold text-ink">{titleFor(pathname)}</h2>

      <div className="relative ml-auto hidden max-w-sm flex-1 sm:block">
        <SearchIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="search"
          placeholder="Search bookings, caregivers…"
          className="w-full rounded-full bg-field py-2 pl-10 pr-4 text-sm text-ink placeholder:text-faint focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
        />
      </div>

      <button
        className="relative rounded-full p-2 text-muted transition-colors hover:bg-page"
        title="Notifications"
      >
        <BellIcon size={20} />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
      </button>

      <div className="flex items-center gap-2.5">
        <Avatar name={user.firstName} size="sm" />
        <span className="hidden text-sm font-semibold text-ink md:inline">
          {user.firstName}
        </span>
      </div>
    </header>
  );
}
