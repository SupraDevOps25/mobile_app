import { api } from "@/lib/api";
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
};
