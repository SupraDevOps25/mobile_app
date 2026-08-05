"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "./token";
import { userFromToken } from "./auth-user";

// Client-side complement to the edge middleware. Middleware is the primary
// route gate (redirects before the page renders); this hook covers in-session
// changes — e.g. signing out in another tab — by re-checking the fresh cookie
// whenever the reactive user changes and bouncing to /login if it's gone.
// Reading the cookie fresh (not the hydration snapshot) avoids falsely
// redirecting a signed-in admin on the first render.
export function useRequireAdmin() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fresh = userFromToken(getToken());
    if (!fresh || fresh.role !== "ADMIN") router.replace("/login");
  }, [user, router]);

  return { user, ready: Boolean(user) };
}
