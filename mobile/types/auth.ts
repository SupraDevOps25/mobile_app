export type Role = "FAMILY" | "CAREGIVER" | "CARE_COORDINATOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface RegisterResponse {
  message: string;
}
