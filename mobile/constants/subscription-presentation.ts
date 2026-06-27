import type { ApiSubscriptionStatus } from "@/services/subscription.service";
import type { ApiAssignmentRole } from "@/services/assignment.service";

export const SUBSCRIPTION_STATUS_LABELS: Record<ApiSubscriptionStatus, string> =
  {
    MATCHING: "Matching your care team",
    TEAM_ASSIGNED: "Care team assigned",
    AWAITING_ACTIVATION: "Awaiting activation",
    ACTIVE: "Active",
    RENEWING: "Renewing",
    PAUSED: "Paused",
    CANCELLED: "Cancelled",
  };

// Amber while the team/activation is still being assembled, green once live.
export function subscriptionStatusPill(status: ApiSubscriptionStatus): {
  bg: string;
  color: string;
} {
  return status === "ACTIVE"
    ? { bg: "rgba(74,222,128,0.2)", color: "#16a34a" }
    : { bg: "rgba(251,191,36,0.2)", color: "#b45309" };
}

export const ASSIGNMENT_ROLE_LABELS: Record<ApiAssignmentRole, string> = {
  PRIMARY: "Lead nurse",
  BACKUP_1: "Backup nurse #1",
  BACKUP_2: "Backup nurse #2",
};
