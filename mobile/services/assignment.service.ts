import { api } from "@/lib/api";
import type { ApiGender } from "@/services/subscription.service";
import type { ApiPackageType } from "@/services/package.service";

export type ApiAssignmentRole = "PRIMARY" | "BACKUP_1" | "BACKUP_2";

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

export interface ApiAssignment {
  id: string;
  role: ApiAssignmentRole;
  status: ApiAssignmentStatus;
  packageType: ApiPackageType;
  packageName: string | null;
  schedule: string | null;
  payoutGhs: number | null;
  offeredAt: string;
  expiresAt: string | null;
  startDate: string | null;
  coordinatorName: string | null;
  client: ApiAssignmentClient;
}

export const assignmentService = {
  offers: () => api.get<ApiAssignment[]>("/assignments/offers"),
  mine: () => api.get<ApiAssignment[]>("/assignments/mine"),
  get: (id: string) => api.get<ApiAssignment>(`/assignments/${id}`),
  accept: (id: string) =>
    api.post<{ id: string; status: ApiAssignmentStatus }>(
      `/assignments/${id}/accept`,
    ),
  decline: (id: string) =>
    api.post<{ id: string; status: ApiAssignmentStatus }>(
      `/assignments/${id}/decline`,
    ),
};
