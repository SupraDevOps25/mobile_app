"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getToken, setToken, subscribeToken } from "@/lib/token";
import { userFromToken, type AdminUser } from "@/lib/auth-user";

// Global auth state via the Context API. The token lives in a cookie; this
// context reads it reactively with useSyncExternalStore (re-renders on same-tab
// sign in/out and on cross-tab `storage` events), decodes the admin, and
// exposes sign-in/out actions. Server snapshot is `null`, so the tree renders
// signed-out during SSR and syncs to the real user after hydration.
interface AuthContextValue {
  user: AdminUser | null;
  isAdmin: boolean;
  /** Persist a freshly issued token (called by the login mutation). */
  signIn: (token: string) => void;
  /** Clear the token — middleware redirects out on the next navigation. */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribeToken, getToken, () => null);

  const value = useMemo<AuthContextValue>(() => {
    const user = userFromToken(token);
    return {
      user,
      isAdmin: user?.role === "ADMIN",
      signIn: (t: string) => setToken(t),
      signOut: () => setToken(null),
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
