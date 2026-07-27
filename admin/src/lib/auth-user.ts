// Decode the signed-in admin from the JWT. The API returns only { accessToken };
// the user's role and name live in the token payload, so we decode it here to
// gate the portal to admins without an extra round-trip.

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

/** Decoded admin, or null if the token is missing, malformed, or expired. */
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

export function isAdmin(user: AdminUser | null): boolean {
  return user?.role === "ADMIN";
}
