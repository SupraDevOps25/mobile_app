import { http } from "@/services/api";
import type { LoginInput } from "@/schemas/auth/login.schema";

// Raw auth API calls. No React here — these are plain async functions the query
// hooks wrap. The login endpoint is public (no bearer token needed yet).
interface LoginResponse {
  accessToken: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  photoUrl: string | null;
  createdAt: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  login: (input: LoginInput) =>
    http.post<LoginResponse>("/auth/login", input, false),

  profile: (signal?: AbortSignal) =>
    http.get<AdminProfile>("/auth/profile", signal),

  updateProfile: (input: UpdateProfileInput) =>
    http.patch<AdminProfile>("/auth/profile", input),

  changePassword: (input: ChangePasswordInput) =>
    http.patch<{ changed: boolean }>("/auth/change-password", input),
};
