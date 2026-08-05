export type UserRole = "FAMILY" | "CAREGIVER" | "CARE_COORDINATOR" | "ADMIN";

export type UserStatus = "ACTIVE" | "BANNED";

export interface AdminUserResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  photoUrl: string | null;
}

// Fuller row for the Users admin page (adds moderation + login info).
export interface AdminUserRow extends AdminUserResult {
  status: UserStatus;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
}

// Human labels for roles, used on the recipient picker.
export const ROLE_LABELS: Record<UserRole, string> = {
  FAMILY: "Family",
  CAREGIVER: "Nurse",
  CARE_COORDINATOR: "Coordinator",
  ADMIN: "Admin",
};
