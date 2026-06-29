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
