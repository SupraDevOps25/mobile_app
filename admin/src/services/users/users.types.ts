export type UserRole = "FAMILY" | "CAREGIVER" | "CARE_COORDINATOR" | "ADMIN";

export interface AdminUserResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  photoUrl: string | null;
}

// Human labels for roles, used on the recipient picker.
export const ROLE_LABELS: Record<UserRole, string> = {
  FAMILY: "Family",
  CAREGIVER: "Nurse",
  CARE_COORDINATOR: "Coordinator",
  ADMIN: "Admin",
};
