import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  reviewService,
  type ApiPendingReview,
  type ApiReviewStatus,
  type SubmitReviewPayload,
} from "@/services/review.service";

export function usePendingReview() {
  return useQuery({
    queryKey: qk.pendingReview,
    queryFn: () => reviewService.pending(),
  });
}

// Review state of a single subscription (active or past): whether the care
// visits are done and which nurses still need rating. Drives the "Rate your
// nurse" button + sheet on the care-plan detail.
export function useReviewStatus(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: qk.reviewStatus(subscriptionId ?? ""),
    queryFn: () => reviewService.statusFor(subscriptionId as string),
    enabled: !!subscriptionId,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) => reviewService.submit(payload),
    onSuccess: (_res, payload) => {
      // Hide the rated nurse's card immediately: drop them from the pending
      // list (and clear it entirely once the last nurse is rated) so the UI
      // updates without waiting for the refetch.
      qc.setQueryData<ApiPendingReview | null>(qk.pendingReview, (prev) => {
        if (!prev) return prev;
        const caregivers = prev.caregivers.filter(
          (c) => c.caregiverId !== payload.caregiverId,
        );
        return caregivers.length > 0 ? { ...prev, caregivers } : null;
      });
      // Same for the per-subscription status that drives the Rate button/sheet.
      qc.setQueryData<ApiReviewStatus | undefined>(
        qk.reviewStatus(payload.subscriptionId),
        (prev) =>
          prev
            ? {
                ...prev,
                caregivers: prev.caregivers.filter(
                  (c) => c.caregiverId !== payload.caregiverId,
                ),
              }
            : prev,
      );
      // Reconcile with the server and unlock renewal on the care plan.
      qc.invalidateQueries({ queryKey: qk.pendingReview });
      qc.invalidateQueries({ queryKey: qk.reviewStatus(payload.subscriptionId) });
      qc.invalidateQueries({ queryKey: qk.activeSubscription });
      qc.invalidateQueries({ queryKey: qk.subscriptionHistory });
    },
  });
}
