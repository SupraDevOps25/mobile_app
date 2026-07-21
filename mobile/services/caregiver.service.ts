import { api } from "@/lib/api";
import { fileForm, type PickedFile } from "@/lib/pick";
import type { ApiPackageType } from "@/services/package.service";
import type { ApiGender } from "@/services/subscription.service";

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

export type ApiCaregiverDocumentType = "GHANA_CARD" | "PIN_CARD";
export type ApiDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface ApiCaregiverDocument {
  id: string;
  type: ApiCaregiverDocumentType;
  idNumber: string | null;
  url: string;
  fileName: string | null;
  status: ApiDocumentStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ApiCaregiverProfile {
  id: string;
  qualification: string | null;
  bio: string | null;
  gender: ApiGender | null;
  dateOfBirth: string | null;
  address: string | null;
  yearsExperience: number;
  hasHomecareExp: boolean;
  languages: string[];
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
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
  documents: ApiCaregiverDocument[];
}

export interface UpdateCaregiverProfilePayload {
  bio?: string;
  gender?: ApiGender;
  dateOfBirth?: string; // ISO date (YYYY-MM-DD)
  address?: string;
  serviceAreas?: string[];
  languages?: string[];
  hasHomecareExp?: boolean;
  yearsExperience?: number;
  lat?: number;
  lng?: number;
}

export interface SchedulePayload {
  workingDays: number[];
  workStart: string;
  workEnd: string;
  maxVisitsPerDay: number;
}

export type ApiEarningsPeriodId = "month" | "all";

export interface ApiEarningsPeriod {
  id: ApiEarningsPeriodId;
  totalGhs: number;
  plans: number;
  subtitle: string;
  chartTitle: string;
  bars: { label: string; amountGhs: number }[];
}

// Per-month earning lifecycle: pending (awaiting family payment / month not
// ended) → available (withdrawable) → requested (awaiting admin) → paid.
export type ApiEarningStatus = "pending" | "available" | "requested" | "paid";

export interface ApiEarningsTransaction {
  id: string;
  date: string; // ISO
  patientName: string;
  service: string;
  amountGhs: number;
  status: ApiEarningStatus;
}

export interface ApiCaregiverEarnings {
  rating: number;
  availableGhs: number; // withdrawable now
  requestedGhs: number; // awaiting admin disbursement
  paidOutGhs: number; // disbursed all-time
  periods: ApiEarningsPeriod[];
  recentTransactions: ApiEarningsTransaction[];
}

export interface ApiPayoutResult {
  count: number;
  totalGhs: number;
}

// One review a family left for this nurse.
export interface ApiCaregiverReview {
  id: string;
  rating: number; // 1..5
  comment: string | null;
  createdAt: string;
  recipientName: string;
  packageType: ApiPackageType;
}

export interface ApiCaregiverReviews {
  rating: number; // running average
  totalReviews: number;
  reviews: ApiCaregiverReview[];
}

export const caregiverService = {
  me: () => api.get<ApiCaregiverProfile>("/caregivers/me"),
  setAvailability: (isAvailable: boolean) =>
    api.patch<ApiCaregiverProfile>("/caregivers/me/availability", {
      isAvailable,
    }),
  setSchedule: (payload: SchedulePayload) =>
    api.patch<ApiCaregiverProfile>("/caregivers/me/schedule", payload),

  updateProfile: (payload: UpdateCaregiverProfilePayload) =>
    api.patch<ApiCaregiverProfile>("/caregivers/me/profile", payload),

  uploadPhoto: (file: PickedFile) =>
    api.upload<ApiCaregiverProfile>("/caregivers/me/photo", fileForm(file)),

  earnings: () =>
    api.get<ApiCaregiverEarnings>("/caregivers/me/earnings"),

  reviews: () =>
    api.get<ApiCaregiverReviews>("/caregivers/me/reviews"),

  requestPayout: () =>
    api.post<ApiPayoutResult>("/caregivers/me/payouts"),

  documents: () =>
    api.get<ApiCaregiverDocument[]>("/caregivers/me/documents"),

  uploadDocument: (params: {
    type: ApiCaregiverDocumentType;
    idNumber?: string;
    file: PickedFile;
  }) =>
    api.upload<ApiCaregiverDocument>(
      "/caregivers/me/documents",
      fileForm(params.file, {
        type: params.type,
        ...(params.idNumber ? { idNumber: params.idNumber } : {}),
      }),
    ),
};
