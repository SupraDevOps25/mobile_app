"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "./api";
import { userFromToken } from "./auth";

// Subscribe to cross-tab token changes so signing out in one tab updates here.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// Client-side route guard. Reads the JWT from localStorage via
// useSyncExternalStore (correct for external, client-only state — renders the
// server snapshot `null` first, then syncs to the real token after hydration
// without a mismatch), decodes the admin, and redirects out if it's missing,
// expired, or not an admin. `ready` gates the shell's spinner.
export function useRequireAdmin() {
  const router = useRouter();
  const token = useSyncExternalStore(subscribe, getToken, () => null);
  const user = userFromToken(token);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) router.replace("/login");
  }, [isAdmin, router]);

  return { user: isAdmin ? user : null, ready: isAdmin };
}
