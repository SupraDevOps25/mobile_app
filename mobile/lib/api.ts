import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/config";

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    // NestJS returns message as string | string[]
    const raw = data.message;
    const message =
      Array.isArray(raw) ? raw[0] : (raw as string) ?? "Something went wrong";
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

  return parse<T>(res);
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

  return parse<T>(res);
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
