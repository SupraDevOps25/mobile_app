import { api } from "./api";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface CaregiverDocument {
  id: string;
  type: "GHANA_CARD" | "PIN_CARD";
  idNumber: string | null;
  url: string;
  status: DocumentStatus;
  reviewNote: string | null;
  createdAt: string;
}

export interface CaregiverListItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  yearsExperience: number;
  hasHomecareExp: boolean;
  serviceAreas: string[];
  licenseVerified: boolean;
  verificationStatus: VerificationStatus;
  documentsCount: number;
  submittedAt: string;
  createdAt: string;
}

export interface CaregiverDetail extends Omit<CaregiverListItem, "documentsCount" | "submittedAt"> {
  bio: string | null;
  gender: "MALE" | "FEMALE" | null;
  dateOfBirth: string | null;
  languages: string[];
  documents: CaregiverDocument[];
}

export interface VerificationResult {
  id: string;
  name: string;
  licenseVerified: boolean;
  verificationStatus: VerificationStatus;
  documents: CaregiverDocument[];
}

export const caregivers = {
  list: (status?: VerificationStatus) =>
    api.get<CaregiverListItem[]>(
      `/admin/caregivers${status ? `?status=${status}` : ""}`,
    ),
  getOne: (id: string) => api.get<CaregiverDetail>(`/admin/caregivers/${id}`),
  setVerification: (id: string, status: "VERIFIED" | "REJECTED", note?: string) =>
    api.patch<VerificationResult>(`/admin/caregivers/${id}/verification`, {
      status,
      note,
    }),
};
