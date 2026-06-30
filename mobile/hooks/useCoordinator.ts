import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { coordinatorService } from "@/services/coordinator.service";

export function useCoordinatorCases() {
  return useQuery({
    queryKey: qk.coordinatorCases,
    queryFn: () => coordinatorService.cases(),
  });
}

export function useCoordinatorLogs() {
  return useQuery({
    queryKey: qk.coordinatorLogs,
    queryFn: () => coordinatorService.logs(),
  });
}

function useCaseMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.coordinatorCases });
    },
  });
}

export function useSetCareStart() {
  return useCaseMutation((args: { id: string; careStartAt: string }) =>
    coordinatorService.setCareStart(args.id, args.careStartAt),
  );
}

export function useActivateCase() {
  return useCaseMutation((id: string) => coordinatorService.activate(id));
}

export function useRematchCase() {
  return useCaseMutation((id: string) => coordinatorService.rematch(id));
}

export function useIssueInvoice() {
  return useCaseMutation((subscriptionId: string) =>
    coordinatorService.issueInvoice(subscriptionId),
  );
}

export function useReviewLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => coordinatorService.reviewLog(visitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.coordinatorLogs });
    },
  });
}
