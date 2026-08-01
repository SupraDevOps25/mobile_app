import { http } from "@/services/api";
import type { AdminUserResult, UserRole } from "./users.types";

// Admin user search — powers the notification recipient picker.
export const usersService = {
  search: (q: string, role?: UserRole, signal?: AbortSignal) => {
    const params = new URLSearchParams({ q });
    if (role) params.set("role", role);
    return http.get<AdminUserResult[]>(
      `/admin/users?${params.toString()}`,
      signal,
    );
  },
};
