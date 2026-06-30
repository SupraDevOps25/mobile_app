import type { ApiAssignmentStatus } from "@/services/assignment.service";
import type { ApiSubscriptionStatus } from "@/services/subscription.service";

// What the coordinator needs to do next for a case, derived from its status.
export type CaseAction = "SET_CARE_START" | "ACTIVATE" | "NONE";

export function caseAction(status: ApiSubscriptionStatus): CaseAction {
  if (status === "TEAM_ASSIGNED") return "SET_CARE_START";
  if (status === "AWAITING_ACTIVATION") return "ACTIVATE";
  return "NONE";
}

export const CASE_ACTION_LABELS: Record<
  Exclude<CaseAction, "NONE">,
  string
> = {
  SET_CARE_START: "Set care-start date",
  ACTIVATE: "Activate care",
};

// How a roster member's offer state reads to the coordinator.
export function rosterStatus(
  status: ApiAssignmentStatus,
  expiresAt: string | null,
): { label: string; bg: string; color: string } {
  if (status === "ACTIVE")
    return { label: "Active", bg: "#f0fdf4", color: "#16a34a" };
  if (status === "ACCEPTED")
    return { label: "Accepted", bg: "#f0fdf4", color: "#16a34a" };
  if (status === "DECLINED")
    return { label: "Declined", bg: "#fef2f2", color: "#dc2626" };
  if (status === "REPLACED")
    return { label: "Replaced", bg: "#f3f4f6", color: "#6b7280" };
  // OFFERED
  if (expiresAt === null)
    return { label: "Queued", bg: "#f3f4f6", color: "#6b7280" };
  const expired = new Date(expiresAt).getTime() < Date.now();
  return expired
    ? { label: "No response", bg: "#fffbeb", color: "#b45309" }
    : { label: "Awaiting reply", bg: "#eff6ff", color: "#2563eb" };
}
