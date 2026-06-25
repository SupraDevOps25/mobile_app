export type CaregiverStats = {
  visitsThisWeek: number;
  visitsDelta: number; // change vs last week
  rating: number;
  topRated: boolean;
  earnedThisWeekGhs: number;
  earnedDeltaGhs: number; // change vs last week
};

export type UpcomingVisit = {
  id: string;
  dayOfMonth: number;
  month: string; // short month, e.g. "MAY"
  familyName: string;
  careType: string;
  time: string;
  durationHrs: number;
  tag: string; // e.g. "Tomorrow", "Mon"
};

export const CAREGIVER_STATS: CaregiverStats = {
  visitsThisWeek: 12,
  visitsDelta: 3,
  rating: 4.9,
  topRated: true,
  earnedThisWeekGhs: 840,
  earnedDeltaGhs: 120,
};
