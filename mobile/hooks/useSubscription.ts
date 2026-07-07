import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  subscriptionService,
  type SubscribePayload,
} from "@/services/subscription.service";

export function useActiveSubscription() {
  return useQuery({
    queryKey: qk.activeSubscription,
    queryFn: () => subscriptionService.getActive(),
  });
}

export function useSubscriptionHistory() {
  return useQuery({
    queryKey: qk.subscriptionHistory,
    queryFn: () => subscriptionService.history(),
  });
}

export function usePastCareDetail(id: string | undefined) {
  return useQuery({
    queryKey: qk.pastCare(id ?? ""),
    queryFn: () => subscriptionService.historyDetail(id as string),
    enabled: !!id,
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubscribePayload) =>
      subscriptionService.subscribe(payload),
    onSuccess: (sub) => {
      qc.setQueryData(qk.activeSubscription, sub);
      qc.invalidateQueries({ queryKey: qk.activeSubscription });
    },
  });
}

export function useRenewSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; rematch?: boolean; reason?: string }) =>
      subscriptionService.renew(args.id, {
        rematch: args.rematch,
        reason: args.reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.activeSubscription });
      qc.invalidateQueries({ queryKey: qk.carePlan });
      // Prefix-invalidates the history list and every per-case detail.
      qc.invalidateQueries({ queryKey: qk.subscriptionHistory });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.activeSubscription });
      qc.invalidateQueries({ queryKey: qk.subscriptionHistory });
    },
  });
}
