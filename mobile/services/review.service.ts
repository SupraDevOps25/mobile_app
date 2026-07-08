import { api } from "@/lib/api";
import type { ApiAssignmentRole } from "@/services/assignment.service";

export interface ApiReviewNurse {
  caregiverId: string;
  role: ApiAssignmentRole;
  name: string;
  initials: string;
  photoUrl: string | null;
}

export interface ApiPendingReview {
  subscriptionId: string;
  packageName: string | null;
  // The lead nurse and any assistant who still need to be rated.
  caregivers: ApiReviewNurse[];
}

export interface SubmitReviewPayload {
  subscriptionId: string;
  caregiverId: string;
  rating: number; // 1..5
  comment?: string;
}

export const reviewService = {
  pending: () => api.get<ApiPendingReview | null>("/reviews/pending"),
  submit: (payload: SubmitReviewPayload) =>
    api.post<{ id: string; rating: number; comment: string | null }>(
      "/reviews",
      payload,
    ),
};
