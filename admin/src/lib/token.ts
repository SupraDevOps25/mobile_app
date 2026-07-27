// Auth token store — the single source of truth for the JWT.
//
// Stored in a cookie (not localStorage) so Next.js middleware can read it on
// the server to gate routes. It is NOT httpOnly on purpose: the client reads it
// to set the Authorization header for API calls (our backend uses bearer auth,
// not cookie auth). Same XSS exposure as localStorage, but it unlocks
// middleware-based route protection.
//
// Exposes subscribe/get for React's useSyncExternalStore, and notifies
// subscribers on same-tab writes (cookies have no native change event).

export const TOKEN_COOKIE = "sc_admin_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const listeners = new Set<() => void>();

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + TOKEN_COOKIE + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string | null): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  if (token) {
    document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE}; samesite=lax${secure}`;
  } else {
    document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToken(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined")
    window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined")
      window.removeEventListener("storage", callback);
  };
}
