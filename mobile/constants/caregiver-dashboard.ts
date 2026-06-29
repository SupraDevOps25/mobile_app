export type CaregiverStats = {
  visitsThisWeek: number;
  visitsDelta: number; // change vs last week
  rating: number;
  topRated: boolean;
  earnedThisWeekGhs: number;
  earnedDeltaGhs: number; // change vs last week
};

export const CAREGIVER_STATS: CaregiverStats = {
  visitsThisWeek: 12,
  visitsDelta: 3,
  rating: 4.9,
  topRated: true,
  earnedThisWeekGhs: 840,
  earnedDeltaGhs: 120,
};
