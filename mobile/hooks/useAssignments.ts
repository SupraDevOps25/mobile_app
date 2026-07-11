import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LIVE_REFETCH_MS, qk } from "@/lib/query-keys";
import { assignmentService } from "@/services/assignment.service";

export function useOffers() {
  return useQuery({
    queryKey: qk.offers,
    queryFn: () => assignmentService.offers(),
    // Poll so a new match offer appears without a manual refresh.
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useMyAssignments() {
  return useQuery({
    queryKey: qk.myAssignments,
    queryFn: () => assignmentService.mine(),
  });
}

export function useAssignment(id: string | undefined) {
  return useQuery({
    queryKey: qk.assignment(id ?? ""),
    queryFn: () => assignmentService.get(id as string),
    enabled: !!id,
  });
}

/** Invalidate the offer/assignment lists after an accept or decline. */
function useOfferMutation(action: (id: string) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.offers });
      qc.invalidateQueries({ queryKey: qk.myAssignments });
    },
  });
}

export function useAcceptOffer() {
  return useOfferMutation((id) => assignmentService.accept(id));
}

export function useDeclineOffer() {
  return useOfferMutation((id) => assignmentService.decline(id));
}

export function useRequestAssistant() {
  return useMutation({
    mutationFn: (id: string) => assignmentService.requestAssistant(id),
  });
}
