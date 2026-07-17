import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { registerForPushToken } from "@/lib/push";
import { notificationService } from "@/services/notification.service";
import type { Role, User } from "@/types/auth";

// Decode JWT payload without an external library.
// React Native (Hermes, RN 0.70+) provides atob globally.
function decodeToken(token: string): { sub: string; email: string; role: string; firstName: string } {
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const paddingNeeded = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "==".slice(0, paddingNeeded);
  return JSON.parse(atob(padded)) as { sub: string; email: string; role: string; firstName: string };
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  saveSession: (accessToken: string) => Promise<User>;
  updateUser: (partial: Partial<User>) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session from SecureStore on app launch.
  useEffect(() => {
    async function hydrate() {
      try {
        const stored = await SecureStore.getItemAsync("auth_token");
        if (stored) {
          const decoded = decodeToken(stored);
          setToken(stored);
          setUser({ id: decoded.sub, email: decoded.email, role: decoded.role as Role, firstName: decoded.firstName ?? "" });
        }
      } finally {
        setIsLoading(false);
      }
    }
    void hydrate();
  }, []);

  const saveSession = useCallback(
    async (accessToken: string) => {
      const decoded = decodeToken(accessToken);
      const newUser: User = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role as Role,
        firstName: decoded.firstName ?? "",
      };
      // Drop any cached data from a previously signed-in account so a new login
      // never shows the old user's dashboard/cases before its own data loads.
      queryClient.clear();
      await SecureStore.setItemAsync("auth_token", accessToken);
      setToken(accessToken);
      setUser(newUser);
      return newUser;
    },
    [queryClient],
  );

  // Patch the in-memory user (e.g. after editing personal info) so the UI
  // reflects the change immediately without needing a re-login.
  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const logout = useCallback(async () => {
    // Best-effort: release this device's push token so notifications for this
    // account stop arriving here after sign-out. Must run while still
    // authenticated (before the token is cleared).
    try {
      const pushToken = await registerForPushToken();
      if (pushToken) await notificationService.unregisterDevice(pushToken);
    } catch {
      // Ignore — logout must proceed regardless of the network call.
    }
    await SecureStore.deleteItemAsync("auth_token");
    setToken(null);
    setUser(null);
    // Wipe the query cache so the next account starts clean (no stale
    // dashboard/cases from the account that just signed out).
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, token, isLoading, saveSession, updateUser, logout }),
    [user, token, isLoading, saveSession, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
