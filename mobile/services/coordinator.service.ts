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
import type { ApiPatientMood, ApiVisitKind } from "@/services/visit.service";

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
  submittedAt: string;
  reviewedAt: string | null;
  clientName: string;
  nurseName: string;
  visitKind: ApiVisitKind;
  scheduledFor: string;
  durationHrs: number;
}

export const coordinatorService = {
  cases: () => api.get<ApiCoordinatorCase[]>("/subscriptions/coordinating"),
  setCareStart: (id: string, careStartAt: string) =>
    api.patch(`/subscriptions/${id}/care-start`, { careStartAt }),
  activate: (id: string) => api.post(`/subscriptions/${id}/activate`),
  rematch: (id: string) => api.post(`/subscriptions/${id}/rematch`),
  logs: () => api.get<ApiCoordinatorLog[]>("/visits/logs"),
  reviewLog: (visitId: string) =>
    api.post<{ visitId: string; reviewedAt: string }>(
      `/visits/${visitId}/review`,
    ),
  issueInvoice: (subscriptionId: string) =>
    api.post<ApiInvoice>(`/billing/invoices/${subscriptionId}`),
};
