import { api } from "@/lib/api";

export interface InitializePaymentResponse {
  paymentId: string;
  amount: number;
  currency: string;
  authorizationUrl: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  id: string;
  status: string; // 'PENDING' | 'SUCCESS' | 'FAILED'
  paystackReference: string;
  amount: number;
  paidAt: string | null;
}

export const paymentService = {
  /** Initialize a Paystack transaction for a confirmed shift. */
  initialize: (shiftId: string) =>
    api.post<InitializePaymentResponse>("/payments/initialize", { shiftId }),

  /** Verify a Paystack transaction after the browser callback. */
  verify: (reference: string) =>
    api.post<VerifyPaymentResponse>("/payments/verify", { reference }),
};
