import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { coordinatorService } from "@/services/coordinator.service";
import type { ApiPackageType } from "@/services/package.service";

export function useCoordinatorCases() {
  return useQuery({
    queryKey: qk.coordinatorCases,
    queryFn: () => coordinatorService.cases(),
  });
}

export function useCoordinatorCaseDetail(id: string) {
  return useQuery({
    queryKey: qk.coordinatorCase(id),
    queryFn: () => coordinatorService.caseDetail(id),
    enabled: !!id,
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

export function useSetAssessment() {
  return useCaseMutation((args: { id: string; assessmentAt: string }) =>
    coordinatorService.setAssessment(args.id, args.assessmentAt),
  );
}

export function useCompleteAssessment() {
  return useCaseMutation((id: string) =>
    coordinatorService.completeAssessment(id),
  );
}

export function useChangePackage() {
  return useCaseMutation(
    (args: { id: string; packageType: ApiPackageType }) =>
      coordinatorService.changePackage(args.id, args.packageType),
  );
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

export function useMatchAssistant() {
  return useCaseMutation((id: string) => coordinatorService.matchAssistant(id));
}

export function useCancelAssistant() {
  return useCaseMutation((id: string) =>
    coordinatorService.cancelAssistant(id),
  );
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

export function useRequestLogChanges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { visitId: string; note?: string }) =>
      coordinatorService.requestChanges(vars.visitId, vars.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.coordinatorLogs });
    },
  });
}
