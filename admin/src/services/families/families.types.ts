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

export type AssignmentRole = "PRIMARY" | "BACKUP_1" | "BACKUP_2" | "ASSISTANT";

export type AssignmentStatus =
  | "OFFERED"
  | "ACCEPTED"
  | "DECLINED"
  | "ACTIVE"
  | "REPLACED";

export interface SubscriptionNurse {
  name: string;
  phone: string;
  photoUrl: string | null;
  role: AssignmentRole;
  status: AssignmentStatus;
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
  nurses: SubscriptionNurse[];
}

export const ROLE_LABELS: Record<AssignmentRole, string> = {
  PRIMARY: "Lead",
  ASSISTANT: "Assistant",
  BACKUP_1: "Backup 1",
  BACKUP_2: "Backup 2",
};

export const ASSIGNMENT_STATUS_TONE: Record<
  AssignmentStatus,
  "green" | "blue" | "amber" | "red" | "slate" | "gray"
> = {
  ACTIVE: "green",
  ACCEPTED: "blue",
  OFFERED: "amber",
  DECLINED: "red",
  REPLACED: "slate",
};

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
