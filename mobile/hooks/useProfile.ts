import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { authService, type UpdateProfilePayload } from "@/services/auth.service";

/** The logged-in user's own account (any role) via GET /auth/profile. */
export function useAuthProfile() {
  return useQuery({
    queryKey: qk.authProfile,
    queryFn: () => authService.profile(),
  });
}

/** Update the logged-in user's own name / phone (any role). */
export function useUpdateAuthProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      authService.updateProfile(payload),
    onSuccess: (profile) => qc.setQueryData(qk.authProfile, profile),
  });
}

/** Change the logged-in user's password. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(payload),
  });
}
