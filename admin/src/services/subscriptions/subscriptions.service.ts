import { http } from "@/services/api";
import type { PackageType } from "@/services/packages/packages.types";
import type {
  BookingListItem,
  CaseDetail,
  SubscriptionStatus,
  UpdateRecipientInput,
} from "./subscriptions.types";

// Admin bookings/cases. Reads come from the admin module; the adjust actions
// reuse the coordinator case-management endpoints, which the API now allows an
// ADMIN to run on any case.
export const subscriptionsService = {
  list: (status?: SubscriptionStatus, q?: string, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q && q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    return http.get<BookingListItem[]>(
      `/admin/subscriptions${qs ? `?${qs}` : ""}`,
      signal,
    );
  },

  getOne: (id: string, signal?: AbortSignal) =>
    http.get<CaseDetail>(`/admin/subscriptions/${id}`, signal),

  // ── Adjust actions (coordinator endpoints, admin-capable) ──
  setAssessment: (id: string, assessmentAt: string) =>
    http.patch(`/subscriptions/${id}/assessment`, { assessmentAt }),

  completeAssessment: (id: string) =>
    http.post(`/subscriptions/${id}/complete-assessment`),

  setCareStart: (id: string, careStartAt: string) =>
    http.patch(`/subscriptions/${id}/care-start`, { careStartAt }),

  changePackage: (id: string, packageType: PackageType) =>
    http.patch(`/subscriptions/${id}/package`, { packageType }),

  rematch: (id: string) => http.post(`/subscriptions/${id}/rematch`),

  activate: (id: string) => http.post(`/subscriptions/${id}/activate`),

  // ── Admin-only overrides ──
  cancel: (id: string) => http.post(`/admin/subscriptions/${id}/cancel`),

  updateRecipient: (id: string, input: UpdateRecipientInput) =>
    http.patch(`/admin/subscriptions/${id}/recipient`, input),

  reassignNurse: (id: string, caregiverId: string) =>
    http.post(`/admin/subscriptions/${id}/reassign-nurse`, { caregiverId }),
};
