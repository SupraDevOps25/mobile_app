import { http } from "@/services/api";
import type { AdminUserResult, AdminUserRow, UserRole } from "./users.types";

// Admin user directory — powers the notification recipient picker and the
// Users admin page (moderation).
export const usersService = {
  search: (q: string, role?: UserRole, signal?: AbortSignal) => {
    const params = new URLSearchParams({ q });
    if (role) params.set("role", role);
    return http.get<AdminUserResult[]>(
      `/admin/users?${params.toString()}`,
      signal,
    );
  },

  list: (q?: string, role?: UserRole, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (q && q.trim()) params.set("q", q.trim());
    if (role) params.set("role", role);
    const qs = params.toString();
    return http.get<AdminUserRow[]>(
      `/admin/users${qs ? `?${qs}` : ""}`,
      signal,
    );
  },

  setBanned: (id: string, banned: boolean, reason?: string) =>
    http.patch<{ id: string; status: UserStatus }>(`/admin/users/${id}/ban`, {
      banned,
      ...(reason ? { reason } : {}),
    }),

  remove: (id: string) =>
    http.del<{ deleted: boolean; id: string }>(`/admin/users/${id}`),
};

type UserStatus = AdminUserRow["status"];
