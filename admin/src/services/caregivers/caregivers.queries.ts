"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { caregiversService } from "./caregivers.service";
import type { VerificationStatus } from "./caregivers.types";
import type { VerificationInput } from "@/schemas/caregivers/verification.schema";

// Query keys in one place so hooks and invalidation stay in sync.
export const caregiverKeys = {
  all: ["caregivers"] as const,
  list: (status?: VerificationStatus) =>
    [...caregiverKeys.all, "list", status ?? "all"] as const,
  detail: (id: string) => [...caregiverKeys.all, "detail", id] as const,
};

export function useCaregivers(status?: VerificationStatus) {
  return useQuery({
    queryKey: caregiverKeys.list(status),
    queryFn: ({ signal }) => caregiversService.list(status, signal),
  });
}

export function useCaregiver(id: string) {
  return useQuery({
    queryKey: caregiverKeys.detail(id),
    queryFn: ({ signal }) => caregiversService.getOne(id, signal),
    enabled: Boolean(id),
  });
}

// Approve/reject a caregiver, then refresh the affected caches so the list and
// detail views reflect the new status immediately.
export function useSetVerification(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VerificationInput) =>
      caregiversService.setVerification(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caregiverKeys.all });
    },
  });
}
