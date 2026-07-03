import { api } from "@/lib/api";
import type { ApiGender } from "@/services/subscription.service";

export type ApiVisitKind = "INITIAL_ASSESSMENT" | "CARE_VISIT";
export type ApiVisitStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MISSED";
export type ApiPatientMood = "POOR" | "LOW" | "GOOD" | "GREAT" | "EXCELLENT";

export interface ApiVisitRow {
  id: string;
  kind: ApiVisitKind;
  status: ApiVisitStatus;
  scheduledFor: string;
  durationHrs: number;
  clientName: string;
  clientInitials: string;
  area: string;
}

export interface ApiVisitLog {
  visitId: string;
  summary: string;
  observations: string | null;
  bloodPressure: string | null;
  bloodGlucose: string | null;
  heartRate: string | null;
  temperature: string | null;
  medicationsGiven: string[];
  quickLog: string[];
  mood: ApiPatientMood | null;
  followUpRecommended: boolean;
  escalationNeeded: boolean;
  changesRequested: boolean;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ApiVisitHistoryRow extends ApiVisitRow {
  hasLog: boolean;
  logReviewed: boolean;
  changesRequested: boolean;
}

export interface ApiVisitDetail {
  id: string;
  kind: ApiVisitKind;
  status: ApiVisitStatus;
  scheduledFor: string;
  durationHrs: number;
  startedAt: string | null;
  endedAt: string | null;
  client: {
    name: string;
    initials: string;
    age: number;
    gender: ApiGender;
    area: string;
    city: string;
    address: string;
    conditions: string[];
    basicCareNeeds: string;
  };
  log: ApiVisitLog | null;
}

export interface ApiCarePlanVisit {
  id: string;
  kind: ApiVisitKind;
  status: ApiVisitStatus;
  scheduledFor: string;
  durationHrs: number;
  nurseName: string;
  hasLog: boolean;
  logReviewed: boolean;
}

export interface SubmitLogPayload {
  summary: string;
  observations?: string;
  bloodPressure?: string;
  bloodGlucose?: string;
  heartRate?: string;
  temperature?: string;
  medicationsGiven?: string[];
  quickLog?: string[];
  mood?: ApiPatientMood;
  followUpRecommended?: boolean;
  escalationNeeded?: boolean;
}

export const visitService = {
  upcoming: () => api.get<ApiVisitRow[]>("/visits/upcoming"),
  history: () => api.get<ApiVisitHistoryRow[]>("/visits/history"),
  get: (id: string) => api.get<ApiVisitDetail>(`/visits/${id}`),
  start: (id: string) =>
    api.post<{ id: string; status: ApiVisitStatus; startedAt: string }>(
      `/visits/${id}/start`,
    ),
  submitLog: (id: string, payload: SubmitLogPayload) =>
    api.post<ApiVisitLog>(`/visits/${id}/log`, payload),
  editLog: (id: string, payload: SubmitLogPayload) =>
    api.patch<ApiVisitLog>(`/visits/${id}/log`, payload),
  carePlan: () => api.get<ApiCarePlanVisit[]>("/visits/care-plan"),
};
