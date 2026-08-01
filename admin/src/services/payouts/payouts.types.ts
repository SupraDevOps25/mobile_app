// Response shapes for the admin payouts API (nurse + coordinator disbursement).

export type PayoutStatus = "PENDING" | "PAID";

// Which side of the payout a request belongs to — drives the endpoint used to
// mark it paid and the label shown in the table.
export type PayoutKind = "nurse" | "coordinator";

export interface NursePayoutRequest {
  id: string;
  status: PayoutStatus;
  amountGhs: number;
  requestedAt: string;
  paidAt: string | null;
  nurseName: string;
  nursePhone: string;
  recipientName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

export interface CoordinatorPayoutRequest {
  id: string;
  status: PayoutStatus;
  amountGhs: number;
  requestedAt: string;
  paidAt: string | null;
  coordinatorName: string;
  coordinatorPhone: string;
  recipientName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

export interface MarkPaidResult {
  id: string;
  status: PayoutStatus;
  paidAt: string | null;
}

// A normalized row the payouts table renders, regardless of payee kind.
export interface PayoutRow {
  id: string;
  kind: PayoutKind;
  payeeName: string;
  payeePhone: string;
  recipientName: string;
  amountGhs: number;
  status: PayoutStatus;
  requestedAt: string;
  paidAt: string | null;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}
