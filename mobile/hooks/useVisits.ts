import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { visitService, type SubmitLogPayload } from "@/services/visit.service";

export function useUpcomingVisits() {
  return useQuery({
    queryKey: qk.upcomingVisits,
    queryFn: () => visitService.upcoming(),
  });
}

export function useVisitHistory() {
  return useQuery({
    queryKey: qk.visitHistory,
    queryFn: () => visitService.history(),
  });
}

export function useCaregiverAssignments() {
  return useQuery({
    queryKey: qk.caregiverAssignments,
    queryFn: () => visitService.assignments(),
  });
}

export function useCarePlan() {
  return useQuery({
    queryKey: qk.carePlan,
    queryFn: () => visitService.carePlan(),
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
