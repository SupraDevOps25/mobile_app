import type { CompetencyId } from "@/constants/competencies";
import type { PackageId } from "@/constants/packages";

// What the nurse accepts is an assignment to a CLIENT/CASE for a package
// (as Primary or Backup) — not a single hourly visit.

export type AssignmentRole = "primary" | "backup_1" | "backup_2";

export const ASSIGNMENT_ROLE_LABELS: Record<AssignmentRole, string> = {
  primary: "Primary nurse",
  backup_1: "Backup nurse #1",
  backup_2: "Backup nurse #2",
};

export type AssignmentStatus = "offered" | "accepted" | "declined" | "active";

export type Assignment = {
  id: string;
  status: AssignmentStatus;
  role: AssignmentRole;
  package: PackageId;

  // Client snapshot (the nurse does not see the full account)
  clientName: string;
  clientInitials: string;
  clientAvatarColor: string;
  clientAge: number;
  clientGender: "Male" | "Female";
  conditions: string[];
  basicCareNeeds: string;

  // Match context
  requiredCompetencies: CompetencyId[];
  area: string;
  city: string;
  distanceKm: number;

  // Engagement terms
  coordinatorName: string;
  schedule: string; // e.g. "8-hour shift · 26 days/month"
  startDate: string; // e.g. "Mon, 30 Jun 2026"
  monthlyPayoutGhs: number;
};

export const ASSIGNMENT_OFFERS: Assignment[] = [
  {
    id: "asg-1",
    status: "offered",
    role: "primary",
    package: "daily-assist",
    clientName: "Kofi Asante",
    clientInitials: "KA",
    clientAvatarColor: "#1e3a8a",
    clientAge: 87,
    clientGender: "Male",
    conditions: ["Hypertension", "Diabetes Type 2", "Mobility issues"],
    basicCareNeeds:
      "Father needs help with morning medication, BP monitoring and light mobility exercises. Prefers a calm, patient nurse.",
    requiredCompetencies: ["personal-care", "hypertension", "diabetes", "medication", "geriatric"],
    area: "East Legon",
    city: "Accra",
    distanceKm: 3.2,
    coordinatorName: "Efua Owusu",
    schedule: "8-hour shift · 26 days/month",
    startDate: "Mon, 30 Jun 2026",
    monthlyPayoutGhs: 3120,
  },
  {
    id: "asg-2",
    status: "offered",
    role: "backup_1",
    package: "wellness",
    clientName: "Ama Boateng",
    clientInitials: "AB",
    clientAvatarColor: "#7c3aed",
    clientAge: 64,
    clientGender: "Female",
    conditions: ["Post-surgery", "Diabetes Type 2"],
    basicCareNeeds:
      "Routine wellness monitoring and wound check following recent surgery. Mostly daytime visits.",
    requiredCompetencies: ["vitals", "wound-care", "diabetes", "medication"],
    area: "Labone",
    city: "Accra",
    distanceKm: 5.1,
    coordinatorName: "Efua Owusu",
    schedule: "4 visits/month",
    startDate: "Wed, 2 Jul 2026",
    monthlyPayoutGhs: 480,
  },
];

export function getAssignment(id: string | undefined): Assignment | null {
  if (!id) return null;
  return ASSIGNMENT_OFFERS.find((a) => a.id === id) ?? null;
}
