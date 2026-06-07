export type Role = "FAMILY" | "CAREGIVER";

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
}

export interface RegisterResponse {
  message: string;
}
