import { http } from "@/services/api";
import type {
  AdminVisit,
  SetVisitStatusResult,
  VisitStatus,
} from "./visits.types";

// Admin visit lookup + status override. The list comes from the admin module;
// the override reuses the existing admin-guarded PATCH /visits/:id/status.
export const visitsService = {
  list: (status?: VisitStatus, q?: string, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q && q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    return http.get<AdminVisit[]>(`/admin/visits${qs ? `?${qs}` : ""}`, signal);
  },

  setStatus: (id: string, status: VisitStatus) =>
    http.patch<SetVisitStatusResult>(`/visits/${id}/status`, { status }),
};
