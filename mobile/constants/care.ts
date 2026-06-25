import type { CompetencyId } from "@/constants/competencies";
import type { PackageId } from "@/constants/packages";

// ── Care recipient (captured at family registration, Step 1) ──────────────

export type CareRecipient = {
  name: string;
  age: number;
  gender: "Male" | "Female";
  /** Relationship to the account holder, e.g. "Father" */
  relationToAccount: string;
  area: string; // e.g. "East Legon"
  city: string; // e.g. "Accra"
  address: string;
  conditions: string[];
  basicCareNeeds: string;
};

// ── Care team (assembled at Step 3) ───────────────────────────────────────

export type CareCoordinator = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  phone: string;
};

export type TeamNurse = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  qualification: string; // e.g. "Registered Nurse"
  yearsExperience: number;
  rating: number;
  reliabilityScore: number; // 0–100
  competencies: CompetencyId[];
  serviceAreas: string[];
  licenseVerified: boolean;
};

export type CareTeamRole = "assigned" | "backup_1" | "backup_2";

export const CARE_TEAM_ROLE_LABELS: Record<CareTeamRole, string> = {
  assigned: "Assigned nurse",
  backup_1: "Backup nurse #1",
  backup_2: "Backup nurse #2",
};

export type CareTeamMember = {
  role: CareTeamRole;
  nurse: TeamNurse;
};

export type CareTeam = {
  coordinator: CareCoordinator;
  members: CareTeamMember[]; // assigned + backup_1 + backup_2
};

// ── Visits (Step 6 deliveries; the first is the initial home visit) ───────

export type VisitKind = "initial-assessment" | "care-visit";
export type VisitStatus = "scheduled" | "in-progress" | "completed" | "missed";

export type Visit = {
  id: string;
  subscriptionId: string;
  kind: VisitKind;
  status: VisitStatus;
  date: string; // ISO 8601
  time: string; // e.g. "10:00 AM"
  durationHrs: number;
  nurseName: string;
};

// ── Subscription (the central object — "subscription before service") ─────

export type SubscriptionStatus =
  | "matching" // subscribed; system + coordinator assembling the care team
  | "team-assigned" // care team set; initial home visit pending
  | "active" // onboarding done; care delivery underway
  | "renewing" // month-end review & renewal
  | "paused"
  | "cancelled";

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  matching: "Matching your care team",
  "team-assigned": "Care team assigned",
  active: "Active",
  renewing: "Renewing",
  paused: "Paused",
  cancelled: "Cancelled",
};

export type Subscription = {
  id: string;
  package: PackageId;
  status: SubscriptionStatus;
  client: CareRecipient;
  startedOn: string; // ISO 8601
  renewsOn: string; // ISO 8601 — next monthly billing date
  priceGhsPerMonth: number;
  careTeam: CareTeam | null; // null while status === "matching"
  visits: Visit[];
};

// ── Mock data ─────────────────────────────────────────────────────────────

const MOCK_COORDINATOR: CareCoordinator = {
  id: "coord-1",
  name: "Efua Owusu",
  initials: "EO",
  avatarColor: "#0d9488",
  phone: "+233244000111",
};

const ASSIGNED_NURSE: TeamNurse = {
  id: "nurse-1",
  name: "Abena Mensah",
  initials: "AM",
  avatarColor: "#3b82f6",
  qualification: "Registered Nurse",
  yearsExperience: 8,
  rating: 4.9,
  reliabilityScore: 97,
  competencies: ["personal-care", "hypertension", "diabetes", "medication", "vitals", "geriatric"],
  serviceAreas: ["East Legon", "Airport", "Cantonments"],
  licenseVerified: true,
};

const BACKUP_NURSE_1: TeamNurse = {
  id: "nurse-2",
  name: "Kwaku Frimpong",
  initials: "KF",
  avatarColor: "#d97706",
  qualification: "Registered Nurse",
  yearsExperience: 6,
  rating: 4.8,
  reliabilityScore: 93,
  competencies: ["personal-care", "mobility", "medication", "vitals", "geriatric"],
  serviceAreas: ["East Legon", "Adenta"],
  licenseVerified: true,
};

const BACKUP_NURSE_2: TeamNurse = {
  id: "nurse-3",
  name: "Esi Agyemang",
  initials: "EA",
  avatarColor: "#4f46e5",
  qualification: "Elder Care Specialist",
  yearsExperience: 4,
  rating: 4.9,
  reliabilityScore: 90,
  competencies: ["personal-care", "hygiene", "feeding", "mobility", "geriatric"],
  serviceAreas: ["East Legon", "Madina"],
  licenseVerified: true,
};

export const MOCK_SUBSCRIPTION: Subscription = {
  id: "sub-1",
  package: "daily-assist",
  status: "active",
  priceGhsPerMonth: 4160,
  startedOn: "2026-06-01T00:00:00.000Z",
  renewsOn: "2026-07-01T00:00:00.000Z",
  client: {
    name: "Kofi Asante",
    age: 87,
    gender: "Male",
    relationToAccount: "Father",
    area: "East Legon",
    city: "Accra",
    address: "14 Boundary Rd, East Legon",
    conditions: ["Hypertension", "Diabetes Type 2", "Mobility issues"],
    basicCareNeeds:
      "Help with morning medication, blood pressure monitoring, light mobility exercises and companionship.",
  },
  careTeam: {
    coordinator: MOCK_COORDINATOR,
    members: [
      { role: "assigned", nurse: ASSIGNED_NURSE },
      { role: "backup_1", nurse: BACKUP_NURSE_1 },
      { role: "backup_2", nurse: BACKUP_NURSE_2 },
    ],
  },
  visits: [
    {
      id: "visit-1",
      subscriptionId: "sub-1",
      kind: "initial-assessment",
      status: "completed",
      date: "2026-06-02T09:00:00.000Z",
      time: "9:00 AM",
      durationHrs: 2,
      nurseName: "Abena Mensah",
    },
    {
      id: "visit-2",
      subscriptionId: "sub-1",
      kind: "care-visit",
      status: "completed",
      date: "2026-06-23T10:00:00.000Z",
      time: "10:00 AM",
      durationHrs: 8,
      nurseName: "Abena Mensah",
    },
    {
      id: "visit-3",
      subscriptionId: "sub-1",
      kind: "care-visit",
      status: "scheduled",
      date: "2026-06-25T10:00:00.000Z",
      time: "10:00 AM",
      durationHrs: 8,
      nurseName: "Abena Mensah",
    },
  ],
};

/** The current family's subscription, or null if they haven't subscribed yet. */
export function getActiveSubscription(): Subscription | null {
  return MOCK_SUBSCRIPTION;
}

export function getSubscription(id: string | undefined): Subscription | null {
  if (!id) return null;
  return MOCK_SUBSCRIPTION.id === id ? MOCK_SUBSCRIPTION : null;
}

/** Look up a care-team member (assigned or backup) by nurse id. */
export function getTeamNurse(id: string | undefined): CareTeamMember | null {
  if (!id || !MOCK_SUBSCRIPTION.careTeam) return null;
  return MOCK_SUBSCRIPTION.careTeam.members.find((m) => m.nurse.id === id) ?? null;
}
