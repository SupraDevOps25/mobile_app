import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { billingService } from "@/services/billing.service";

export function useInvoices() {
  return useQuery({
    queryKey: qk.invoices,
    queryFn: () => billingService.invoices(),
  });
}

export function usePayInvoice() {
  return useMutation({
    mutationFn: (paymentId: string) => billingService.pay(paymentId),
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
