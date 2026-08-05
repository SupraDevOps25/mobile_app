import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/config";

// A global "you've been signed out" hook. The AuthContext registers this so the
// api layer can force a sign-out when an authenticated request is rejected with
// 401 — e.g. the account was banned or deleted mid-session, or the token
// expired. Kept module-level so plain service calls (not just hooks) trigger it.
type UnauthorizedHandler = (message: string) => void;
let onUnauthorized: UnauthorizedHandler | null = null;
let unauthorizedInFlight = false;

export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  onUnauthorized = fn;
}

async function parse<T>(res: Response, hadToken: boolean): Promise<T> {
  // A successful authenticated response means the session is healthy again.
  if (res.ok) unauthorizedInFlight = false;

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    // NestJS returns message as string | string[]
    const raw = data.message;
    const message =
      Array.isArray(raw) ? raw[0] : (raw as string) ?? "Something went wrong";

    // Only for requests we made *while signed in* — a 401 here means the
    // session is no longer valid (banned/deleted/expired). Fire once.
    if (res.status === 401 && hadToken && onUnauthorized && !unauthorizedInFlight) {
      unauthorizedInFlight = true;
      onUnauthorized(message);
    }
    throw new Error(message);
  }
  return data as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync("auth_token");

  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  return parse<T>(res, Boolean(token));
}

// Multipart upload. Deliberately does NOT set Content-Type so fetch can add the
// multipart boundary itself; the file is appended as { uri, name, type }.
async function upload<T>(
  path: string,
  form: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const token = await SecureStore.getItemAsync("auth_token");

  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    method,
    body: form,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return parse<T>(res, Boolean(token));
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData, method?: "POST" | "PATCH") =>
    upload<T>(path, form, method),
};
