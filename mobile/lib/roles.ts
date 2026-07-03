import type { Role } from "@/types/auth";

export interface RoleMeta {
  label: string; // human-readable role, shown under the user's name
  color: string; // accent / avatar colour for the role
}

const META: Record<Role, RoleMeta> = {
  FAMILY: { label: "Family account holder", color: "#1e3a8a" },
  CAREGIVER: { label: "Caregiver", color: "#16a34a" },
  CARE_COORDINATOR: { label: "Care Coordinator", color: "#0d9488" },
  ADMIN: { label: "Administrator", color: "#4f46e5" },
};

export function roleMeta(role: Role): RoleMeta {
  return META[role] ?? META.FAMILY;
}
