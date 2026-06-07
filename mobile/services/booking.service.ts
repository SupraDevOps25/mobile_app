import { api } from "@/lib/api";

// CareType values must match the Prisma enum exactly
export type CareType =
  | "ELDERLY_CARE"
  | "CHILD_CARE"
  | "DISABILITY_CARE"
  | "POSTPARTUM_CARE"
  | "PALLIATIVE_CARE";

export interface InstantBookPayload {
  caregiverProfileId: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  careType: CareType;
  notes?: string;
}

export interface ShiftResponse {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  careType: string;
}

export const bookingService = {
  /** Creates a CONFIRMED shift directly — used before Paystack payment. */
  instantBook: (payload: InstantBookPayload) =>
    api.post<ShiftResponse>("/shifts/instant-book", payload),
};
