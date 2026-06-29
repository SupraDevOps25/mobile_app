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
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.activeSubscription });
    },
  });
}
