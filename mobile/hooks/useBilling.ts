import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LIVE_REFETCH_MS, qk } from "@/lib/query-keys";
import { billingService } from "@/services/billing.service";

export function useInvoices() {
  return useQuery({
    queryKey: qk.invoices,
    queryFn: () => billingService.invoices(),
    // Poll so a coordinator's newly issued invoice surfaces on the family's
    // dashboard (the "invoice ready" banner) without a manual refresh.
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function usePayInvoice() {
  return useMutation({
    mutationFn: (vars: { paymentId: string; callbackUrl?: string }) =>
      billingService.pay(vars.paymentId, vars.callbackUrl),
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => billingService.verify(reference),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.invoices });
      qc.invalidateQueries({ queryKey: qk.activeSubscription });
    },
  });
}
