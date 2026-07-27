import { getToken } from "@/lib/token";

// The general API wrapper every service builds on. A thin fetch layer that:
//   • prefixes the API base URL,
//   • attaches the JWT bearer token from the cookie store,
//   • serializes/parses JSON,
//   • normalizes the server's error shape into Error(message) so TanStack Query
//     and forms get a readable `error.message`.
//
// Route protection (redirect-on-unauthenticated) is handled by Next.js
// middleware, not here — this layer stays focused on talking to the API.
//
// Base URL comes from NEXT_PUBLIC_API_URL; falls back to localhost (never prod)
// so a missing var fails safe against a local API.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const raw = data?.message ?? data?.error ?? `Request failed (${res.status})`;
    throw new Error(Array.isArray(raw) ? raw[0] : raw);
  }
  return data as T;
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => apiFetch<T>(path, { signal }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    apiFetch<T>(path, { method: "POST", body, auth }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
};
