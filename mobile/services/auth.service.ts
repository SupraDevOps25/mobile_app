import { api } from "@/lib/api";
import { fileForm, type PickedFile } from "@/lib/pick";
import type { AuthResponse, RegisterResponse, Role } from "@/types/auth";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

// The logged-in user's own account, from GET /auth/profile. Works for any
// role — unlike /family/me which is family-only.
export interface ApiAuthProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: Role;
  photoUrl: string | null;
  createdAt: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const authService = {
  /** Check email + phone uniqueness before showing role selection. */
  checkAvailability: (email: string, phone: string) =>
    api.post<{ available: true }>("/auth/check-availability", { email, phone }),

  /** Creates account + sends verification email. Does NOT return a token. */
  register: (payload: RegisterPayload) =>
    api.post<RegisterResponse>("/auth/register", payload),

  resendVerification: (email: string) =>
    api.post<{ message: string }>("/auth/resend-verification", { email }),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload),

  /** The logged-in user's account (any role). */
  profile: () => api.get<ApiAuthProfile>("/auth/profile"),

  /** Update the logged-in user's own name / phone (any role). */
  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<ApiAuthProfile>("/auth/profile", payload),

  /** Upload / replace the logged-in user's own profile photo (any role). */
  uploadPhoto: (file: PickedFile) =>
    api.upload<ApiAuthProfile>("/auth/profile/photo", fileForm(file)),

  /** Change the logged-in user's password. */
  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => api.patch<{ changed: boolean }>("/auth/change-password", payload),
};
