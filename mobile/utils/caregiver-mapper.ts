import type { CaregiverDetail, WeekDay } from "@/constants/mock-data";
import type { CaregiverDetail as ApiDetail } from "@/services/caregiver.service";

const CARE_TYPE_SERVICE_LABEL: Record<string, string> = {
  ELDERLY_CARE: "Elderly Care",
  CHILD_CARE: "Child Care",
  DISABILITY_CARE: "Disability Care",
  POSTPARTUM_CARE: "Postpartum Care",
  PALLIATIVE_CARE: "Palliative Care",
};

function buildWeeklyAvailability(
  slots: { startTime: string }[],
): WeekDay[] {
  const DAY_SHORTS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Build a set of Mon-first day indices (0=Mon) that have at least one slot
  const daysWithSlots = new Set(
    slots.map((s) => {
      const js = new Date(s.startTime).getDay(); // 0=Sun
      return js === 0 ? 6 : js - 1;
    }),
  );
  return DAY_SHORTS.map((short, i) => ({
    short,
    available: daysWithSlots.has(i),
  }));
}

/**
 * Maps an API caregiver detail response to the CaregiverDetail shape used
 * across all mobile screens. Fields not yet stored in the DB get safe defaults.
 */
export function apiToCaregiverDetail(api: ApiDetail): CaregiverDetail {
  return {
    id: api.profileId,
    name: api.name,
    role: api.role,
    yearsExp: api.yearsExp,
    rating: api.rating,
    availability: api.availability,
    initials: api.initials,
    avatarColor: api.avatarColor,
    // DB fields not yet in schema — defaults until extended
    location: "Accra, Ghana",
    distanceKm: 0,
    reviewCount: 0,
    visitsDone: 0,
    responseTimeMin: 15,
    hourlyRate: api.hourlyRate,
    bio: api.bio,
    services: api.careTypes.map((ct) => CARE_TYPE_SERVICE_LABEL[ct] ?? ct),
    weeklyAvailability: buildWeeklyAvailability(api.availabilitySlots),
    reviews: [],
  };
}
