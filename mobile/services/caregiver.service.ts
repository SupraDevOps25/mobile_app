import { api } from "@/lib/api";

// Clinical competency enum values from the backend.
export type ApiCompetency =
  | "PERSONAL_CARE"
  | "HYGIENE"
  | "FEEDING"
  | "MOBILITY"
  | "MEDICATION"
  | "VITALS"
  | "WOUND_CARE"
  | "CATHETER_CARE"
  | "CHRONIC_DISEASE"
  | "HYPERTENSION"
  | "DIABETES"
  | "STROKE_REHAB"
  | "DEMENTIA"
  | "GERIATRIC"
  | "REHAB"
  | "PALLIATIVE";

export type ApiVerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export interface ApiCaregiverProfile {
  id: string;
  qualification: string | null;
  bio: string | null;
  yearsExperience: number;
  competencies: ApiCompetency[];
  serviceAreas: string[];
  licenseVerified: boolean;
  isAvailable: boolean;
  // Weekly working pattern. workingDays uses JS getDay(): 0=Sun … 6=Sat.
  workingDays: number[];
  workStart: string; // "HH:MM"
  workEnd: string; // "HH:MM"
  maxVisitsPerDay: number;
  verificationStatus: ApiVerificationStatus;
  rating: number;
  reliabilityScore: number;
  totalReviews: number;
}

export interface SchedulePayload {
  workingDays: number[];
  workStart: string;
  workEnd: string;
  maxVisitsPerDay: number;
}

export const caregiverService = {
  me: () => api.get<ApiCaregiverProfile>("/caregivers/me"),
  setAvailability: (isAvailable: boolean) =>
    api.patch<ApiCaregiverProfile>("/caregivers/me/availability", {
      isAvailable,
    }),
  setSchedule: (payload: SchedulePayload) =>
    api.patch<ApiCaregiverProfile>("/caregivers/me/schedule", payload),
};
