import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LIVE_REFETCH_MS, qk } from "@/lib/query-keys";
import {
  coordinatorService,
  type ApiCoordinatorCase,
  type ApiCoordinatorEarnings,
  type ApiCoordinatorLog,
  type UpdateCoordinatorPayload,
} from "@/services/coordinator.service";
import type { ApiPackageType } from "@/services/package.service";

export function useCoordinatorCases() {
  return useQuery({
    queryKey: qk.coordinatorCases,
    queryFn: () => coordinatorService.cases(),
    refetchInterval: LIVE_REFETCH_MS,
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
    // Polls so a nurse's revised/resubmitted log surfaces for review without a
    // manual refresh.
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useCoordinatorProfile() {
  return useQuery({
    queryKey: qk.coordinatorProfile,
    queryFn: () => coordinatorService.me(),
  });
}

export function useUpdateCoordinatorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoordinatorPayload) =>
      coordinatorService.updateMe(payload),
    onSuccess: (profile) => qc.setQueryData(qk.coordinatorProfile, profile),
  });
}

export function useCoordinatorEarnings() {
  return useQuery({
    queryKey: qk.coordinatorEarnings,
    queryFn: () => coordinatorService.earnings(),
  });
}

export function useRequestCoordinatorPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => coordinatorService.requestPayout(),
    onSuccess: (res) => {
      // Reflect the request immediately so the earnings screen updates without
      // waiting for the refetch, then invalidate to reconcile with the server.
      qc.setQueryData<ApiCoordinatorEarnings>(qk.coordinatorEarnings, (old) =>
        old
          ? {
              ...old,
              availableGhs: 0,
              requestedGhs: old.requestedGhs + res.totalGhs,
              recentTransactions: old.recentTransactions.map((t) =>
                t.status === "available" ? { ...t, status: "requested" } : t,
              ),
            }
          : old,
      );
      qc.invalidateQueries({ queryKey: qk.coordinatorEarnings });
    },
  });
}

function useCaseMutation<TArgs>(
  fn: (args: TArgs) => Promise<unknown>,
  // Optional optimistic patch of the cached case list, applied the moment the
  // server confirms so the case screen updates without waiting for the refetch.
  optimisticPatch?: (
    args: TArgs,
    cases: ApiCoordinatorCase[],
  ) => ApiCoordinatorCase[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_data, args) => {
      if (optimisticPatch) {
        qc.setQueryData<ApiCoordinatorCase[]>(qk.coordinatorCases, (prev) =>
          prev ? optimisticPatch(args, prev) : prev,
        );
      }
      qc.invalidateQueries({ queryKey: qk.coordinatorCases });
    },
  });
}

export function useSetAssessment() {
  return useCaseMutation(
    (args: { id: string; assessmentAt: string }) =>
      coordinatorService.setAssessment(args.id, args.assessmentAt),
    (args, cases) =>
      cases.map((c) =>
        c.id === args.id ? { ...c, assessmentAt: args.assessmentAt } : c,
      ),
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
  return useCaseMutation(
    (args: { id: string; careStartAt: string }) =>
      coordinatorService.setCareStart(args.id, args.careStartAt),
    (args, cases) =>
      cases.map((c) =>
        c.id === args.id ? { ...c, careStartAt: args.careStartAt } : c,
      ),
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
    onSuccess: (data) => {
      // Reflect "reviewed" instantly, then refetch to stay in sync.
      qc.setQueryData<ApiCoordinatorLog[]>(qk.coordinatorLogs, (prev) =>
        prev?.map((l) =>
          l.visitId === data.visitId
            ? { ...l, reviewedAt: data.reviewedAt }
            : l,
        ),
      );
      qc.invalidateQueries({ queryKey: qk.coordinatorLogs });
      // The case detail's visit badges reflect the same log status.
      qc.invalidateQueries({ queryKey: qk.coordinatorCases });
    },
  });
}

export function useRequestLogChanges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { visitId: string; note?: string }) =>
      coordinatorService.requestChanges(vars.visitId, vars.note),
    onSuccess: (data) => {
      qc.setQueryData<ApiCoordinatorLog[]>(qk.coordinatorLogs, (prev) =>
        prev?.map((l) =>
          l.visitId === data.visitId
            ? {
                ...l,
                changesRequested: data.changesRequested,
                reviewNotes: data.reviewNotes,
              }
            : l,
        ),
      );
      qc.invalidateQueries({ queryKey: qk.coordinatorLogs });
      qc.invalidateQueries({ queryKey: qk.coordinatorCases });
    },
  });
}
