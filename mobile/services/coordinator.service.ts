import { api } from "@/lib/api";
import type { ApiInvoice } from "@/services/billing.service";
import type { ApiPackageType } from "@/services/package.service";
import type {
  ApiCareTeam,
  ApiGender,
  ApiSubscriptionStatus,
} from "@/services/subscription.service";
import type { ApiPatientMood } from "@/services/visit.service";

export interface ApiCoordinatorRecipient {
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
}

export interface ApiPendingLog {
  visitId: string;
  summary: string;
  mood: ApiPatientMood | null;
  escalationNeeded: boolean;
  followUpRecommended: boolean;
  submittedAt: string;
  clientName: string;
  nurseName: string;
}

export const coordinatorService = {
  cases: () => api.get<ApiCoordinatorCase[]>("/subscriptions/coordinating"),
  setCareStart: (id: string, careStartAt: string) =>
    api.patch(`/subscriptions/${id}/care-start`, { careStartAt }),
  activate: (id: string) => api.post(`/subscriptions/${id}/activate`),
  pendingLogs: () => api.get<ApiPendingLog[]>("/visits/logs/pending"),
  reviewLog: (visitId: string) =>
    api.post<{ visitId: string; reviewedAt: string }>(
      `/visits/${visitId}/review`,
    ),
  issueInvoice: (subscriptionId: string) =>
    api.post<ApiInvoice>(`/billing/invoices/${subscriptionId}`),
};
