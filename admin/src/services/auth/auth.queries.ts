"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userFromToken } from "@/lib/auth-user";
import { authService } from "./auth.service";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from "./auth.service";
import type { LoginInput } from "@/schemas/auth/login.schema";

// Login mutation. Validates the account is an admin *before* persisting the
// token (a non-admin's valid credentials still can't enter the portal), then
// stores it via the auth context and navigates to the dashboard.
export function useLoginMutation() {
  const { signIn } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { accessToken } = await authService.login(input);
      const user = userFromToken(accessToken);
      if (!user || user.role !== "ADMIN") {
        throw new Error("This account is not an admin.");
      }
      return accessToken;
    },
    onSuccess: (accessToken) => {
      signIn(accessToken);
      router.replace("/");
    },
  });
}

export const authKeys = {
  profile: ["auth", "profile"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile,
    queryFn: ({ signal }) => authService.profile(signal),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      authService.updateProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(authKeys.profile, profile);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      authService.changePassword(input),
  });
}
