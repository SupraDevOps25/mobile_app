import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { visitService, type SubmitLogPayload } from "@/services/visit.service";

export function useUpcomingVisits() {
  return useQuery({
    queryKey: qk.upcomingVisits,
    queryFn: () => visitService.upcoming(),
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
    },
  });
}
