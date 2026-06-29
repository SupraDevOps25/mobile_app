// Single source of truth for which tab group a signed-in user lands on.
export type HomeGroup = "(tabs)" | "(caregiver-tabs)" | "(coordinator-tabs)";

export function homeGroupForRole(role: string | undefined): HomeGroup {
  if (role === "CAREGIVER") return "(caregiver-tabs)";
  if (role === "CARE_COORDINATOR") return "(coordinator-tabs)";
  return "(tabs)"; // FAMILY (and any fallback)
}
