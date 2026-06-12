export type EarningsPeriodId = "week" | "month" | "all";

export type ChartBar = {
  label: string;
  amountGhs: number;
};

export type EarningsPeriod = {
  id: EarningsPeriodId;
  label: string; // segmented control label
  headline: string; // e.g. "TOTAL EARNED THIS MONTH"
  totalGhs: number;
  subtitle: string; // e.g. "May 2026 · 23 visits completed"
  visits: number;
  rating: number;
  careHours: number;
  chartTitle: string; // e.g. "Daily earnings — May"
  bars: ChartBar[];
};

export type TransactionStatus = "paid" | "pending";

export type Transaction = {
  id: string;
  dayOfMonth: number;
  month: string; // short month, e.g. "MAY"
  patientName: string;
  service: string;
  durationHrs: number;
  amountGhs: number;
  status: TransactionStatus;
};

export type PendingPayout = {
  amountGhs: number;
  arrivesBy: string; // e.g. "24 May"
};

export const EARNINGS_PERIODS: EarningsPeriod[] = [
  {
    id: "week",
    label: "This week",
    headline: "Total earned this week",
    totalGhs: 840,
    subtitle: "19 – 25 May · 12 visits completed",
    visits: 12,
    rating: 4.9,
    careHours: 21,
    chartTitle: "Daily earnings — this week",
    bars: [
      { label: "Mon", amountGhs: 120 },
      { label: "Tue", amountGhs: 90 },
      { label: "Wed", amountGhs: 180 },
      { label: "Thu", amountGhs: 60 },
      { label: "Fri", amountGhs: 150 },
      { label: "Sat", amountGhs: 240 },
      { label: "Sun", amountGhs: 0 },
    ],
  },
  {
    id: "month",
    label: "This month",
    headline: "Total earned this month",
    totalGhs: 1840,
    subtitle: "May 2026 · 23 visits completed",
    visits: 23,
    rating: 4.9,
    careHours: 46,
    chartTitle: "Daily earnings — May",
    bars: [
      { label: "W1", amountGhs: 380 },
      { label: "W2", amountGhs: 420 },
      { label: "W3", amountGhs: 320 },
      { label: "W4", amountGhs: 720 },
    ],
  },
  {
    id: "all",
    label: "All time",
    headline: "Total earned all time",
    totalGhs: 7260,
    subtitle: "Since January 2026 · 94 visits completed",
    visits: 94,
    rating: 4.9,
    careHours: 188,
    chartTitle: "Monthly earnings — 2026",
    bars: [
      { label: "Jan", amountGhs: 980 },
      { label: "Feb", amountGhs: 1260 },
      { label: "Mar", amountGhs: 1540 },
      { label: "Apr", amountGhs: 1640 },
      { label: "May", amountGhs: 1840 },
    ],
  },
];

export const PENDING_PAYOUT: PendingPayout = {
  amountGhs: 360,
  arrivesBy: "24 May",
};

export const RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    dayOfMonth: 23,
    month: "MAY",
    patientName: "Kofi Asante",
    service: "Chronic Disease",
    durationHrs: 3,
    amountGhs: 120,
    status: "paid",
  },
  {
    id: "txn-2",
    dayOfMonth: 22,
    month: "MAY",
    patientName: "Ama Boateng",
    service: "Wound Care",
    durationHrs: 1.5,
    amountGhs: 90,
    status: "paid",
  },
  {
    id: "txn-3",
    dayOfMonth: 21,
    month: "MAY",
    patientName: "Yaw Darko",
    service: "Elderly Care",
    durationHrs: 3,
    amountGhs: 180,
    status: "pending",
  },
  {
    id: "txn-4",
    dayOfMonth: 20,
    month: "MAY",
    patientName: "Efua Mensah",
    service: "Post-Hospital Recovery",
    durationHrs: 2,
    amountGhs: 120,
    status: "paid",
  },
];
