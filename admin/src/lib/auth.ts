import { api, setToken } from "./api";

// The API returns only { accessToken }; the user's role and name live inside
// the JWT payload, so we decode it client-side to gate the portal to admins.

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  firstName: string;
  exp?: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function userFromToken(token: string | null): AdminUser | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    firstName: payload.firstName,
  };
}

/** Logs in and returns the decoded user. Throws if the account isn't an admin. */
export async function login(emailOrPhone: string, password: string) {
  const { accessToken } = await api.post<{ accessToken: string }>(
    "/auth/login",
    { emailOrPhone, password },
    false,
  );
  const user = userFromToken(accessToken);
  if (!user || user.role !== "ADMIN") {
    throw new Error("This account is not an admin.");
  }
  setToken(accessToken);
  return user;
}

export function logout() {
  setToken(null);
}
