// Nurse matching for the MVP. Per product direction, nurses are ranked on:
//   • Competency  → years of homecare experience (0 = never worked homecare)
//   • Availability → nurse-controlled flag (applied as a filter, not scored)
//   • Proximity    → nurse serves the care recipient's area
//   • Reliability  → completed vs missed visits, smoothed with a neutral prior
//   • Performance  → family star ratings, smoothed with a neutral prior
//   • Continuity   → previously served this family
//
// Availability + license verification are eligibility filters applied in the
// query; this module scores and ranks the eligible nurses.
//
// Cold-start note: reliability and rating use Bayesian priors so a brand-new
// nurse with no visits/reviews starts at a fair neutral score (not zero) and
// converges to their real record as data accrues — otherwise newcomers would be
// permanently buried under established nurses.
import { reliabilityRate } from '../common/reliability';

export type RankableCaregiver = {
  id: string;
  yearsExperience: number;
  completedVisits: number;
  missedVisits: number;
  rating: number; // running average, 0–5 (0 when no reviews yet)
  totalReviews: number;
  serviceAreas: string[];
};

export type RankContext = {
  recipientArea: string;
  /** Caregiver ids who have served this family before. */
  priorCaregiverIds: Set<string>;
};

const EXPERIENCE_CAP = 20; // years beyond this don't add more weight
const WEIGHTS = {
  experiencePerYear: 4, // → 0–80
  reliability: 100, // → 0–100 (the behavioural backbone)
  rating: 25, // → 0–25
  proximity: 30,
  continuity: 40,
};

// Rating prior: treat a new nurse as if they had a few reviews averaging 4.0.
const RATING_PRIOR = { mean: 4.0, pseudoReviews: 3 };

function servesArea(serviceAreas: string[], area: string): boolean {
  const target = area.trim().toLowerCase();
  return serviceAreas.some((a) => a.trim().toLowerCase() === target);
}

/** Smoothed average rating (0–5) from the running average + review count. */
function smoothedRating(average: number, count: number): number {
  const { mean, pseudoReviews } = RATING_PRIOR;
  return (average * count + mean * pseudoReviews) / (count + pseudoReviews);
}

export function scoreCaregiver(c: RankableCaregiver, ctx: RankContext): number {
  const experience =
    Math.min(c.yearsExperience, EXPERIENCE_CAP) * WEIGHTS.experiencePerYear;
  const reliability =
    reliabilityRate(c.completedVisits, c.missedVisits) * WEIGHTS.reliability;
  const rating =
    (smoothedRating(c.rating, c.totalReviews) / 5) * WEIGHTS.rating;
  const proximity = servesArea(c.serviceAreas, ctx.recipientArea)
    ? WEIGHTS.proximity
    : 0;
  const continuity = ctx.priorCaregiverIds.has(c.id) ? WEIGHTS.continuity : 0;
  return experience + reliability + rating + proximity + continuity;
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
