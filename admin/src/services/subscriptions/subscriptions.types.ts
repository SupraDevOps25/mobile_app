import type {
  PackageType,
} from "@/services/packages/packages.types";
import type {
  AssignmentRole,
  AssignmentStatus,
  SubscriptionStatus,
} from "@/services/families/families.types";
import type { VisitKind, VisitStatus } from "@/services/visits/visits.types";

export type { SubscriptionStatus };

export interface BookingListItem {
  id: string;
  packageType: PackageType;
  status: SubscriptionStatus;
  priceGhs: number;
  familyName: string;
  recipientName: string;
  coordinatorName: string | null;
  visitsCount: number;
  createdAt: string;
}

export type PatientMood =
  | "POOR"
  | "LOW"
  | "GOOD"
  | "GREAT"
  | "EXCELLENT"
  | null;

export interface CaseVisitLog {
  summary: string;
  observations: string | null;
  bloodPressure: string | null;
  bloodGlucose: string | null;
  heartRate: string | null;
  temperature: string | null;
  medicationsGiven: string[];
  quickLog: string[];
  mood: PatientMood;
  followUpRecommended: boolean;
  escalationNeeded: boolean;
  changesRequested: boolean;
  reviewNotes: string[];
  submittedAt: string;
  reviewedAt: string | null;
}

export interface CaseVisit {
  id: string;
  kind: VisitKind;
  status: VisitStatus;
  scheduledFor: string;
  durationHrs: number;
  nurseName: string;
  nursePhotoUrl: string | null;
  log: CaseVisitLog | null;
}

export interface CaseTeamMember {
  name: string;
  phone: string;
  photoUrl: string | null;
  role: AssignmentRole;
  status: AssignmentStatus;
  offeredAt: string;
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED";

export interface CasePayment {
  id: string;
  amount: number;
  status: PaymentStatus;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  paidAt: string | null;
}

export interface UpdateRecipientInput {
  name?: string;
  age?: number;
  gender?: "MALE" | "FEMALE";
  relationToAccount?: string;
  area?: string;
  city?: string;
  address?: string;
  conditions?: string[];
  basicCareNeeds?: string;
}

export interface CaseRecipient {
  name: string;
  age: number;
  gender: "MALE" | "FEMALE";
  relationToAccount: string;
  area: string;
  city: string;
  address: string;
  conditions: string[];
  basicCareNeeds: string;
}

export interface CaseDetail {
  id: string;
  status: SubscriptionStatus;
  packageType: PackageType;
  priceGhs: number;
  coordinatorFeeGhs: number;
  needsAssistant: boolean;
  assessmentAt: string | null;
  careStartAt: string | null;
  activatedAt: string | null;
  startedAt: string;
  renewsAt: string | null;
  createdAt: string;
  package: { name: string; tagline: string; inclusions: string[] } | null;
  family: { id: string; name: string; email: string; phone: string };
  recipient: CaseRecipient;
  coordinator: { name: string; phone: string } | null;
  team: CaseTeamMember[];
  payments: CasePayment[];
  visits: CaseVisit[];
}
