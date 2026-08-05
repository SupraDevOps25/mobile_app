"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { subscriptionsService } from "./subscriptions.service";
import type { PackageType } from "@/services/packages/packages.types";
import type {
  SubscriptionStatus,
  UpdateRecipientInput,
} from "./subscriptions.types";

export const bookingKeys = {
  all: ["subscriptions"] as const,
  list: (status?: SubscriptionStatus, q?: string) =>
    [...bookingKeys.all, "list", status ?? "all", q ?? ""] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
};

export function useBookings(status?: SubscriptionStatus, q?: string) {
  const term = q?.trim() ?? "";
  return useQuery({
    queryKey: bookingKeys.list(status, term),
    queryFn: ({ signal }) =>
      subscriptionsService.list(status, term || undefined, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: ({ signal }) => subscriptionsService.getOne(id, signal),
    enabled: Boolean(id),
  });
}

// One hook for every case-adjust action. Each invalidates the case detail (and
// the list) so the UI reflects the change immediately.
export function useCaseActions(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
  };

  const setAssessment = useMutation({
    mutationFn: (assessmentAt: string) =>
      subscriptionsService.setAssessment(id, assessmentAt),
    onSuccess: invalidate,
  });
  const completeAssessment = useMutation({
    mutationFn: () => subscriptionsService.completeAssessment(id),
    onSuccess: invalidate,
  });
  const setCareStart = useMutation({
    mutationFn: (careStartAt: string) =>
      subscriptionsService.setCareStart(id, careStartAt),
    onSuccess: invalidate,
  });
  const changePackage = useMutation({
    mutationFn: (packageType: PackageType) =>
      subscriptionsService.changePackage(id, packageType),
    onSuccess: invalidate,
  });
  const rematch = useMutation({
    mutationFn: () => subscriptionsService.rematch(id),
    onSuccess: invalidate,
  });
  const activate = useMutation({
    mutationFn: () => subscriptionsService.activate(id),
    onSuccess: invalidate,
  });
  const cancel = useMutation({
    mutationFn: () => subscriptionsService.cancel(id),
    onSuccess: invalidate,
  });
  const updateRecipient = useMutation({
    mutationFn: (input: UpdateRecipientInput) =>
      subscriptionsService.updateRecipient(id, input),
    onSuccess: invalidate,
  });
  const reassignNurse = useMutation({
    mutationFn: (caregiverId: string) =>
      subscriptionsService.reassignNurse(id, caregiverId),
    onSuccess: invalidate,
  });

  return {
    setAssessment,
    completeAssessment,
    setCareStart,
    changePackage,
    rematch,
    activate,
    cancel,
    updateRecipient,
    reassignNurse,
  };
}
