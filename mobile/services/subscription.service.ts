import { api } from "@/lib/api";
import type { ApiPackageType } from "@/services/package.service";
import type {
  ApiAssignmentRole,
  ApiAssignmentStatus,
} from "@/services/assignment.service";
import type { ApiCarePlanVisit } from "@/services/visit.service";

export type ApiGender = "MALE" | "FEMALE";

export type ApiBookingFor = "SELF" | "LOVED_ONE";

export interface ApiCoordinator {
  name: string;
  phone: string;
}

// A review the family sees on a nurse's profile — privacy-safe (no reviewer).
export interface ApiNurseReview {
  id: string;
  rating: number; // 1..5
  comment: string | null;
  createdAt: string;
  packageType: ApiPackageType;
}

export interface ApiTeamNurse {
  assignmentId: string;
  role: ApiAssignmentRole;
  status: ApiAssignmentStatus;
  name: string;
  initials: string;
  phone: string;
  qualification: string | null;
  yearsExperience: number;
  rating: number;
  reliabilityScore: number;
  serviceAreas: string[];
  gender: ApiGender | null;
  bio: string | null;
  languages: string[];
  hasHomecareExp: boolean;
  totalReviews: number;
  reviews: ApiNurseReview[];
  photoUrl: string | null;
  licenseVerified: boolean;
}

export interface ApiCareTeam {
  coordinator: ApiCoordinator | null;
  nurses: ApiTeamNurse[];
}

export type ApiSubscriptionStatus =
  | "MATCHING"
  | "TEAM_ASSIGNED"
  | "AWAITING_ACTIVATION"
  | "ACTIVE"
  | "RENEWING"
  | "PAUSED"
  | "CANCELLED";

export interface ApiCareRecipient {
  id: string;
  bookingFor: ApiBookingFor;
  name: string;
  age: number;
  gender: ApiGender;
  relationToAccount: string;
  area: string;
  city: string;
  address: string;
  conditions: string[];
  basicCareNeeds: string;
}

export interface ApiSubscription {
  id: string;
  packageType: ApiPackageType;
  status: ApiSubscriptionStatus;
  priceGhs: number;
  startedAt: string;
  renewsAt: string | null;
  careStartAt: string | null;
  activatedAt: string | null;
  careTeam: ApiCareTeam;
  careRecipient: ApiCareRecipient;
}

export interface ApiPastCare {
  id: string;
  packageType: ApiPackageType;
  status: ApiSubscriptionStatus;
  priceGhs: number;
  startedAt: string;
  endedAt: string;
  recipientName: string;
  relationToAccount: string;
  completedVisits: number;
}

export interface ApiPastCareDetail extends ApiSubscription {
  packageName: string | null;
  endedAt: string;
  completedVisits: number;
  totalVisits: number;
  visits: ApiCarePlanVisit[];
}

export interface SubscribePayload {
  packageType: ApiPackageType;
  careRecipient: {
    bookingFor: ApiBookingFor;
    name: string;
    age: number;
    gender: ApiGender;
    relationToAccount: string;
    area: string;
    city: string;
    address: string;
    conditions: string[];
    basicCareNeeds: string;
  };
}

export const subscriptionService = {
  subscribe: (payload: SubscribePayload) =>
    api.post<ApiSubscription>("/subscriptions", payload),
  getActive: () => api.get<ApiSubscription | null>("/subscriptions/active"),
  history: () => api.get<ApiPastCare[]>("/subscriptions/history"),
  historyDetail: (id: string) =>
    api.get<ApiPastCareDetail>(`/subscriptions/history/${id}`),
  renew: (id: string, payload?: { rematch?: boolean; reason?: string }) =>
    api.post<ApiSubscription>(`/subscriptions/${id}/renew`, payload),
  cancel: (id: string) =>
    api.post<ApiSubscription>(`/subscriptions/${id}/cancel`),
};
