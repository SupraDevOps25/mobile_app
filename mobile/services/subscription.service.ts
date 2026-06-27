import { api } from "@/lib/api";
import type { ApiPackageType } from "@/services/package.service";

export type ApiGender = "MALE" | "FEMALE";

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
  careRecipient: ApiCareRecipient;
}

export interface SubscribePayload {
  packageType: ApiPackageType;
  careRecipient: {
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
  renew: (id: string) => api.post<ApiSubscription>(`/subscriptions/${id}/renew`),
  cancel: (id: string) =>
    api.post<ApiSubscription>(`/subscriptions/${id}/cancel`),
};
