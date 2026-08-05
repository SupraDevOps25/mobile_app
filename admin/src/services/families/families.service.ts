import { http } from "@/services/api";
import type { FamilyDetail, FamilyListItem } from "./families.types";

export const familiesService = {
  list: (q?: string, signal?: AbortSignal) => {
    const qs = q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    return http.get<FamilyListItem[]>(`/admin/families${qs}`, signal);
  },

  getOne: (id: string, signal?: AbortSignal) =>
    http.get<FamilyDetail>(`/admin/families/${id}`, signal),
};
