// Nurse matching for the MVP. Per product direction, nurses are ranked on:
//   • Competency  → years of homecare experience (0 = never worked homecare)
//   • Availability → nurse-controlled flag (applied as a filter, not scored)
//   • Proximity    → nurse serves the care recipient's area
//   • Reliability  → reliability score (0–100)
//   • Continuity   → previously served this family
//
// Availability + license verification are eligibility filters applied in the
// query; this module scores and ranks the eligible nurses.

export type RankableCaregiver = {
  id: string;
  yearsExperience: number;
  reliabilityScore: number;
  serviceAreas: string[];
};

export type RankContext = {
  recipientArea: string;
  /** Caregiver ids who have served this family before. */
  priorCaregiverIds: Set<string>;
};

const EXPERIENCE_CAP = 20; // years beyond this don't add more weight
const WEIGHTS = {
  experiencePerYear: 4,
  proximity: 30,
  continuity: 40,
};

function servesArea(serviceAreas: string[], area: string): boolean {
  const target = area.trim().toLowerCase();
  return serviceAreas.some((a) => a.trim().toLowerCase() === target);
}

export function scoreCaregiver(c: RankableCaregiver, ctx: RankContext): number {
  const experience =
    Math.min(c.yearsExperience, EXPERIENCE_CAP) * WEIGHTS.experiencePerYear;
  const proximity = servesArea(c.serviceAreas, ctx.recipientArea)
    ? WEIGHTS.proximity
    : 0;
  const continuity = ctx.priorCaregiverIds.has(c.id) ? WEIGHTS.continuity : 0;
  return c.reliabilityScore + experience + proximity + continuity;
}

/** Eligible caregivers ranked best-first. */
export function rankCaregivers(
  caregivers: RankableCaregiver[],
  ctx: RankContext,
): RankableCaregiver[] {
  return [...caregivers].sort(
    (a, b) => scoreCaregiver(b, ctx) - scoreCaregiver(a, ctx),
  );
}
