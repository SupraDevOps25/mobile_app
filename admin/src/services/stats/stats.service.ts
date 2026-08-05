import { http } from "@/services/api";
import type { PackageType } from "@/services/packages/packages.types";
import type { SubscriptionStatus } from "@/services/families/families.types";

export interface DashboardStats {
  bookingsThisMonth: number;
  activeCaregivers: number;
  pendingApprovals: number;
  revenueThisMonthGhs: number;
  totals: {
    families: number;
    caregivers: number;
    coordinators: number;
    activeSubscriptions: number;
  };
  recentBookings: {
    id: string;
    recipientName: string;
    familyName: string;
    packageType: PackageType;
    status: SubscriptionStatus;
    createdAt: string;
  }[];
  pendingCaregivers: {
    id: string;
    name: string;
    photoUrl: string | null;
    submittedAt: string;
  }[];
}

export const statsService = {
  overview: (signal?: AbortSignal) =>
    http.get<DashboardStats>("/admin/stats", signal),
};
