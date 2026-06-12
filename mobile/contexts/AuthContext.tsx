import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  const saveSession = useCallback(async (accessToken: string) => {
    const decoded = decodeToken(accessToken);
    const newUser: User = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role as Role,
      firstName: decoded.firstName ?? "",
    };
    await SecureStore.setItemAsync("auth_token", accessToken);
    setToken(accessToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("auth_token");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, saveSession, logout }),
    [user, token, isLoading, saveSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
