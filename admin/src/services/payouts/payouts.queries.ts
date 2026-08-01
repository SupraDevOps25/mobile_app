"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { payoutsService } from "./payouts.service";

// Query keys in one place so hooks and invalidation stay in sync.
export const payoutKeys = {
  all: ["payouts"] as const,
  nurse: () => [...payoutKeys.all, "nurse"] as const,
  coordinator: () => [...payoutKeys.all, "coordinator"] as const,
};

export function useNursePayouts() {
  return useQuery({
    queryKey: payoutKeys.nurse(),
    queryFn: ({ signal }) => payoutsService.listNurse(signal),
  });
}

export function useCoordinatorPayouts() {
  return useQuery({
    queryKey: payoutKeys.coordinator(),
    queryFn: ({ signal }) => payoutsService.listCoordinator(signal),
  });
}

export function useMarkNursePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payoutsService.markNursePaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutKeys.nurse() });
    },
  });
}

export function useMarkCoordinatorPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payoutsService.markCoordinatorPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutKeys.coordinator() });
    },
  });
}
