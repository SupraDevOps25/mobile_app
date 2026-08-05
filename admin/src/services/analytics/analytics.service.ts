import { http } from "@/services/api";
import type { PackageType } from "@/services/packages/packages.types";
import type { SubscriptionStatus } from "@/services/families/families.types";
import type { VerificationStatus } from "@/services/caregivers/caregivers.types";

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface Analytics {
  monthlyBookings: SeriesPoint[];
  monthlyRevenue: SeriesPoint[];
  subscriptionsByStatus: { status: SubscriptionStatus; count: number }[];
  caregiversByStatus: { status: VerificationStatus; count: number }[];
  packageDistribution: { packageType: PackageType; count: number }[];
}

export const analyticsService = {
  overview: (signal?: AbortSignal) =>
    http.get<Analytics>("/admin/analytics", signal),
};
