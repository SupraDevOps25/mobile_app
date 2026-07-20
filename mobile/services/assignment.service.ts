import { api } from "@/lib/api";
import type { ApiGender } from "@/services/subscription.service";
import type { ApiPackageType } from "@/services/package.service";

export type ApiAssignmentRole =
  | "PRIMARY"
  | "ASSISTANT"
  | "BACKUP_1"
  | "BACKUP_2";

export type ApiAssignmentStatus =
  | "OFFERED"
  | "ACCEPTED"
  | "DECLINED"
  | "ACTIVE"
  | "REPLACED";

export interface ApiAssignmentClient {
  name: string;
  initials: string;
  age: number;
  gender: ApiGender;
  area: string;
  city: string;
  conditions: string[];
  basicCareNeeds: string;
}

export interface ApiAssignmentFamily {
  name: string;
  phone: string;
  photoUrl: string | null;
}

export interface ApiAssignment {
  id: string;
  role: ApiAssignmentRole;
  status: ApiAssignmentStatus;
  packageType: ApiPackageType;
  packageName: string | null;
  schedule: string | null;
  inclusions: string[];
  // Daily commitment: hours per visit and how many visits over the month.
  visitDurationHrs: number | null;
  visitsPerCycle: number | null;
  payoutGhs: number | null;
  // What the nurse earns solo (full 60% pool) vs shared equally with a second
  // nurse (half). Shown so they see both scenarios.
  soloPayoutGhs: number | null;
  sharedPayoutGhs: number | null;
  offeredAt: string;
  expiresAt: string | null;
  startDate: string | null;
  coordinatorName: string | null;
  family: ApiAssignmentFamily;
  client: ApiAssignmentClient;
}

export const assignmentService = {
  offers: () => api.get<ApiAssignment[]>("/assignments/offers"),
  get: (id: string) => api.get<ApiAssignment>(`/assignments/${id}`),
  accept: (id: string) =>
    api.post<{ id: string; status: ApiAssignmentStatus }>(
      `/assignments/${id}/accept`,
    ),
  decline: (id: string) =>
    api.post<{ id: string; status: ApiAssignmentStatus }>(
      `/assignments/${id}/decline`,
    ),
  requestAssistant: (id: string) =>
    api.post<{ subscriptionId: string; needsAssistant: boolean }>(
      `/assignments/${id}/request-assistant`,
    ),
};
