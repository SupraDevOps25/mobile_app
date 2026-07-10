// Shared types for the earnings screen and its components. The data itself is
// real, fetched from GET /caregivers/me/earnings (see useCaregiverEarnings).

export type EarningsPeriodId = "month" | "all";

export type ChartBar = {
  label: string;
  amountGhs: number;
};

export type TransactionStatus = "pending" | "available" | "requested" | "paid";

export type Transaction = {
  id: string;
  dayOfMonth: number;
  month: string; // short month, e.g. "MAY"
  year: number;
  patientName: string;
  service: string; // care package name
  amountGhs: number;
  status: TransactionStatus;
};

// Static per-period copy (labels / headlines). Numbers come from the API.
export const PERIOD_META: Record<
  EarningsPeriodId,
  { label: string; headline: string }
> = {
  month: { label: "This month", headline: "Earned this month" },
  all: { label: "All time", headline: "Total earned all time" },
};

export const PERIOD_ORDER: EarningsPeriodId[] = ["month", "all"];
