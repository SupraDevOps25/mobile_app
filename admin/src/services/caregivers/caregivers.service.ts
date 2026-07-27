import { http } from "@/services/api";
import type { VerificationInput } from "@/schemas/caregivers/verification.schema";
import type {
  CaregiverDetail,
  CaregiverListItem,
  VerificationResult,
  VerificationStatus,
} from "./caregivers.types";

// Raw admin caregivers API calls (GET list/detail, PATCH verification). The
// query hooks in caregivers.queries wrap these with caching + invalidation.
export const caregiversService = {
  list: (status?: VerificationStatus, signal?: AbortSignal) =>
    http.get<CaregiverListItem[]>(
      `/admin/caregivers${status ? `?status=${status}` : ""}`,
      signal,
    ),

  getOne: (id: string, signal?: AbortSignal) =>
    http.get<CaregiverDetail>(`/admin/caregivers/${id}`, signal),

  setVerification: (id: string, input: VerificationInput) =>
    http.patch<VerificationResult>(
      `/admin/caregivers/${id}/verification`,
      input,
    ),
};
