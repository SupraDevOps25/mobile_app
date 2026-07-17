import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  subscriptionService,
  type ApiPastCareDetail,
  type ApiSubscription,
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
    onSuccess: (sub, args) => {
      // Reflect the renewal instantly so the "up for renewal" card/banner
      // disappears without waiting for the refetch (the status leaves
      // RENEWING), then reconcile with the server.
      qc.setQueryData<ApiSubscription | null>(qk.activeSubscription, sub);
      qc.setQueryData<ApiPastCareDetail | undefined>(
        qk.pastCare(args.id),
        (prev) => (prev ? { ...prev, status: sub.status } : prev),
      );
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
    onSuccess: (sub, id) => {
      // Cancelling ends the plan: it's no longer the active subscription, and
      // its detail flips to CANCELLED — hide the renewal card at once.
      qc.setQueryData<ApiSubscription | null>(qk.activeSubscription, null);
      qc.setQueryData<ApiPastCareDetail | undefined>(qk.pastCare(id), (prev) =>
        prev ? { ...prev, status: sub.status } : prev,
      );
      qc.invalidateQueries({ queryKey: qk.activeSubscription });
      qc.invalidateQueries({ queryKey: qk.subscriptionHistory });
    },
  });
}
