import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  reviewService,
  type SubmitReviewPayload,
} from "@/services/review.service";

export function usePendingReview() {
  return useQuery({
    queryKey: qk.pendingReview,
    queryFn: () => reviewService.pending(),
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) => reviewService.submit(payload),
    onSuccess: () => {
      // Clears the pending prompt and unlocks renewal on the care plan.
      qc.invalidateQueries({ queryKey: qk.pendingReview });
      qc.invalidateQueries({ queryKey: qk.activeSubscription });
      qc.invalidateQueries({ queryKey: qk.subscriptionHistory });
    },
  });
}
