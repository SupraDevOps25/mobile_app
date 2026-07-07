import { api } from "@/lib/api";
import type {
  ApiAssignmentRole,
  ApiAssignmentStatus,
} from "@/services/assignment.service";
import type { ApiInvoice } from "@/services/billing.service";
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
  createdAt: string;
  assessmentAt: string | null;
  assessmentDone: boolean;
  needsAssistant: boolean;
  careStartAt: string | null;
  activatedAt: string | null;
  renewsAt: string | null;
  family: { name: string; phone: string };
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
  nurseName: string;
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
  visits: ApiCoordinatorCaseVisit[];
}

export const coordinatorService = {
  cases: () => api.get<ApiCoordinatorCase[]>("/subscriptions/coordinating"),
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
