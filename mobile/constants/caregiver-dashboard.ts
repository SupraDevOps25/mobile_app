export type CaregiverStats = {
  visitsThisWeek: number;
  visitsDelta: number; // change vs last week
  rating: number;
  topRated: boolean;
  earnedThisWeekGhs: number;
  earnedDeltaGhs: number; // change vs last week
};

export type VisitRequest = {
  id: string;
  familyName: string;
  initials: string;
  avatarColor: string;
  careType: string;
  payoutGhs: number;
  date: string; // e.g. "Mon, 26 May"
  time: string; // e.g. "10:00 AM"
  durationHrs: number;
  location: string;
  distanceKm: number;
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

export const NEW_VISIT_REQUESTS: VisitRequest[] = [
  {
    id: "req-1",
    familyName: "Kofi Asante",
    initials: "KA",
    avatarColor: "#1e3a8a",
    careType: "Chronic Disease Care",
    payoutGhs: 120,
    date: "Mon, 26 May",
    time: "10:00 AM",
    durationHrs: 2,
    location: "East Legon",
    distanceKm: 3.2,
  },
];

export const UPCOMING_VISITS: UpcomingVisit[] = [
  {
    id: "visit-1",
    dayOfMonth: 24,
    month: "MAY",
    familyName: "Ama Boateng",
    careType: "Wound Care",
    time: "9:00 AM",
    durationHrs: 1.5,
    tag: "Tomorrow",
  },
  {
    id: "visit-2",
    dayOfMonth: 26,
    month: "MAY",
    familyName: "Yaw Darko",
    careType: "Elderly Care",
    time: "2:00 PM",
    durationHrs: 3,
    tag: "Mon",
  },
];
