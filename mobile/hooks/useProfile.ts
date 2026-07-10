import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import type { PickedFile } from "@/lib/pick";
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

/** Upload / replace the logged-in user's own profile photo (any role). */
export function useUploadAuthPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: PickedFile) => authService.uploadPhoto(file),
    onSuccess: (profile) => {
      qc.setQueryData(qk.authProfile, profile);
      // The coordinator screens read their photo from /coordinators/me — keep
      // that in sync too (no-op for other roles that don't observe this key).
      qc.invalidateQueries({ queryKey: qk.coordinatorProfile });
    },
  });
}

/** Change the logged-in user's password. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(payload),
  });
}
