import type { PackageType } from "@/services/packages/packages.types";

export type SubscriptionStatus =
  | "MATCHING"
  | "TEAM_ASSIGNED"
  | "AWAITING_ACTIVATION"
  | "ACTIVE"
  | "RENEWING"
  | "PAUSED"
  | "CANCELLED";

export interface FamilyListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  subscriptionsCount: number;
  activeCount: number;
}

export interface FamilySubscription {
  id: string;
  packageType: PackageType;
  status: SubscriptionStatus;
  priceGhs: number;
  recipientName: string;
  coordinatorName: string | null;
  startedAt: string;
  careStartAt: string | null;
  renewsAt: string | null;
}

export interface FamilyDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  address: string | null;
  memberSince: string;
  subscriptions: FamilySubscription[];
}
