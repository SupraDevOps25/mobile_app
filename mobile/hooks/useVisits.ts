import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LIVE_REFETCH_MS, qk } from "@/lib/query-keys";
import { visitService, type SubmitLogPayload } from "@/services/visit.service";

export function useUpcomingVisits() {
  return useQuery({
    queryKey: qk.upcomingVisits,
    queryFn: () => visitService.upcoming(),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useVisitHistory() {
  return useQuery({
    queryKey: qk.visitHistory,
    queryFn: () => visitService.history(),
    // Polls so a coordinator's "changes requested" shows up without a manual
    // refresh (drives the nurse dashboard's revise nudge).
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useCaregiverAssignments() {
  return useQuery({
    queryKey: qk.caregiverAssignments,
    queryFn: () => visitService.assignments(),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useVisit(id: string | undefined) {
  return useQuery({
    queryKey: qk.visit(id ?? ""),
    queryFn: () => visitService.get(id as string),
    enabled: !!id,
  });
}

export function useStartVisit(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => visitService.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.visit(id) });
      qc.invalidateQueries({ queryKey: qk.upcomingVisits });
      qc.invalidateQueries({ queryKey: qk.caregiverAssignments });
    },
  });
}

export function useSubmitLog(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitLogPayload) =>
      visitService.submitLog(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.visit(id) });
      qc.invalidateQueries({ queryKey: qk.upcomingVisits });
      qc.invalidateQueries({ queryKey: qk.visitHistory });
      qc.invalidateQueries({ queryKey: qk.caregiverAssignments });
    },
  });
}

export function useEditLog(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitLogPayload) => visitService.editLog(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.visit(id) });
      qc.invalidateQueries({ queryKey: qk.visitHistory });
      qc.invalidateQueries({ queryKey: qk.caregiverAssignments });
    },
  });
}
