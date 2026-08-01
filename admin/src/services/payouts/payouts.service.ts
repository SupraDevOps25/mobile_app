import { http } from "@/services/api";
import type {
  CoordinatorPayoutRequest,
  MarkPaidResult,
  NursePayoutRequest,
} from "./payouts.types";

// Raw admin payouts API calls. The query hooks in payouts.queries wrap these
// with caching + invalidation.
export const payoutsService = {
  listNurse: (signal?: AbortSignal) =>
    http.get<NursePayoutRequest[]>("/admin/payouts", signal),

  markNursePaid: (id: string) =>
    http.patch<MarkPaidResult>(`/admin/payouts/${id}/paid`),

  listCoordinator: (signal?: AbortSignal) =>
    http.get<CoordinatorPayoutRequest[]>("/admin/payouts/coordinators", signal),

  markCoordinatorPaid: (id: string) =>
    http.patch<MarkPaidResult>(`/admin/payouts/coordinators/${id}/paid`),
};
