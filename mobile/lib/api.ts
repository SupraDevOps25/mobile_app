import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/config";

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

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
