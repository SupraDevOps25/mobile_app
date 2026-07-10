import { api } from "@/lib/api";
import type {
  ApiAssignmentRole,
  ApiAssignmentStatus,
} from "@/services/assignment.service";
import type { ApiInvoice } from "@/services/billing.service";
import type {
  ApiEarningsPeriod,
  ApiEarningsTransaction,
  ApiPayoutResult,
} from "@/services/caregiver.service";
import type { ApiPackageType } from "@/services/package.service";
import type {
  ApiBookingFor,
  ApiCareTeam,
  ApiGender,
  ApiSubscriptionStatus,
} from "@/services/subscription.service";
import type {
  ApiPatientMood,
  ApiVisitKind,
  ApiVisitStatus,
} from "@/services/visit.service";

// One matched nurse on a case, in any state — what the coordinator sees so
// they can chase up the primary/backups and re-match if no one accepts.
export interface ApiRosterMember {
  assignmentId: string;
  role: ApiAssignmentRole;
  status: ApiAssignmentStatus;
  name: string;
  initials: string;
  phone: string;
  photoUrl: string | null;
  expiresAt: string | null;
}

export interface ApiCoordinatorRecipient {
  bookingFor: ApiBookingFor;
  name: string;
  age: number;
  gender: ApiGender;
  area: string;
  city: string;
  address: string;
  conditions: string[];
  basicCareNeeds: string;
}

export interface ApiCoordinatorCase {
  id: string;
  packageType: ApiPackageType;
  status: ApiSubscriptionStatus;
  priceGhs: number;
  coordinatorFeeGhs: number; // the coordinator's 8% fee for one billing month
  createdAt: string;
  assessmentAt: string | null;
  assessmentDone: boolean;
  needsAssistant: boolean;
  careStartAt: string | null;
  activatedAt: string | null;
  renewsAt: string | null;
  family: { name: string; phone: string; photoUrl: string | null };
  recipient: ApiCoordinatorRecipient;
  careTeam: ApiCareTeam;
  roster: ApiRosterMember[];
}

export interface ApiCoordinatorLog {
  visitId: string;
  summary: string;
  observations: string | null;
  bloodPressure: string | null;
  bloodGlucose: string | null;
  heartRate: string | null;
  temperature: string | null;
  medicationsGiven: string[];
  quickLog: string[];
  mood: ApiPatientMood | null;
  followUpRecommended: boolean;
  escalationNeeded: boolean;
  changesRequested: boolean;
  reviewNotes: string[];
  submittedAt: string;
  reviewedAt: string | null;
  clientName: string;
  clientPhotoUrl: string | null;
  nurseName: string;
  nursePhotoUrl: string | null;
  visitKind: ApiVisitKind;
  visitStatus: ApiVisitStatus;
  scheduledFor: string;
  durationHrs: number;
}

// One visit on a case, as the coordinator sees it — with its log status so the
// row can link through to the submitted log (whether the case is active or not).
export interface ApiCoordinatorCaseVisit {
  id: string;
  kind: ApiVisitKind;
  status: ApiVisitStatus;
  scheduledFor: string;
  durationHrs: number;
  nurseName: string;
  nursePhotoUrl: string | null;
  hasLog: boolean;
  logReviewed: boolean;
  changesRequested: boolean;
}

// Deep view of one case: what the package includes + every visit on it.
export interface ApiCoordinatorCaseDetail {
  packageName: string | null;
  packageTagline: string | null;
  inclusions: string[];
  priceGhs: number;
  coordinatorFeeGhs: number; // the coordinator's 8% fee for one billing month
  visits: ApiCoordinatorCaseVisit[];
}

// The coordinator's own personal + professional profile (GET /coordinators/me).
export interface ApiCoordinatorProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  photoUrl: string | null;
  memberSince: string;
  gender: ApiGender | null;
  dateOfBirth: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  yearsExperience: number;
  bio: string | null;
  workplace: string | null;
}

export interface UpdateCoordinatorPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: ApiGender;
  dateOfBirth?: string;
  address?: string;
  lat?: number;
  lng?: number;
  yearsExperience?: number;
  bio?: string;
  workplace?: string;
}

// The coordinator's earnings (their 8% fee per paid subscription month).
export interface ApiCoordinatorEarnings {
  availableGhs: number; // withdrawable now
  requestedGhs: number; // awaiting admin disbursement
  paidOutGhs: number; // disbursed all-time
  activeCases: number;
  periods: ApiEarningsPeriod[];
  recentTransactions: ApiEarningsTransaction[];
}

export const coordinatorService = {
  cases: () => api.get<ApiCoordinatorCase[]>("/subscriptions/coordinating"),
  me: () => api.get<ApiCoordinatorProfile>("/coordinators/me"),
  earnings: () =>
    api.get<ApiCoordinatorEarnings>("/coordinators/me/earnings"),
  requestPayout: () =>
    api.post<ApiPayoutResult>("/coordinators/me/payouts"),
  updateMe: (payload: UpdateCoordinatorPayload) =>
    api.patch<ApiCoordinatorProfile>("/coordinators/me", payload),
  caseDetail: (id: string) =>
    api.get<ApiCoordinatorCaseDetail>(`/subscriptions/coordinating/${id}`),
  setAssessment: (id: string, assessmentAt: string) =>
    api.patch(`/subscriptions/${id}/assessment`, { assessmentAt }),
  completeAssessment: (id: string) =>
    api.post(`/subscriptions/${id}/complete-assessment`),
  changePackage: (id: string, packageType: ApiPackageType) =>
    api.patch(`/subscriptions/${id}/package`, { packageType }),
  setCareStart: (id: string, careStartAt: string) =>
    api.patch(`/subscriptions/${id}/care-start`, { careStartAt }),
  activate: (id: string) => api.post(`/subscriptions/${id}/activate`),
  rematch: (id: string) => api.post(`/subscriptions/${id}/rematch`),
  matchAssistant: (id: string) =>
    api.post(`/subscriptions/${id}/match-assistant`),
  cancelAssistant: (id: string) =>
    api.post(`/subscriptions/${id}/cancel-assistant`),
  logs: () => api.get<ApiCoordinatorLog[]>("/visits/logs"),
  reviewLog: (visitId: string) =>
    api.post<{ visitId: string; reviewedAt: string }>(
      `/visits/${visitId}/review`,
    ),
  requestChanges: (visitId: string, note?: string) =>
    api.post<{ visitId: string; changesRequested: boolean; reviewNotes: string[] }>(
      `/visits/${visitId}/request-changes`,
      { note },
    ),
  issueInvoice: (subscriptionId: string) =>
    api.post<ApiInvoice>(`/billing/invoices/${subscriptionId}`),
};
