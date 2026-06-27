import { api } from "@/lib/api";

export type ApiPaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED";

export interface ApiInvoice {
  id: string;
  status: ApiPaymentStatus;
  amount: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  paidAt: string | null;
  authorizationUrl: string | null;
  reference: string | null;
  createdAt: string;
}

export interface ApiPayInit {
  paymentId: string;
  authorizationUrl: string;
  reference: string;
  amount: number;
}

export const billingService = {
  invoices: () => api.get<ApiInvoice[]>("/billing/invoices"),
  pay: (paymentId: string) =>
    api.post<ApiPayInit>(`/billing/invoices/${paymentId}/pay`),
  verify: (reference: string) =>
    api.post<{ status: ApiPaymentStatus; reference: string }>(
      "/billing/verify",
      { reference },
    ),
};
