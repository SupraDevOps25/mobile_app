import { http } from "@/services/api";
import type { LoginInput } from "@/schemas/auth/login.schema";

// Raw auth API calls. No React here — these are plain async functions the query
// hooks wrap. The login endpoint is public (no bearer token needed yet).
interface LoginResponse {
  accessToken: string;
}

export const authService = {
  login: (input: LoginInput) =>
    http.post<LoginResponse>("/auth/login", input, false),
};
