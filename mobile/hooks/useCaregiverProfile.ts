import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PickedFile } from "@/lib/pick";
import { qk } from "@/lib/query-keys";
import {
  caregiverService,
  type ApiCaregiverDocument,
  type ApiCaregiverDocumentType,
  type ApiCaregiverEarnings,
  type ApiCaregiverProfile,
  type SchedulePayload,
  type UpdateCaregiverProfilePayload,
} from "@/services/caregiver.service";

export function useCaregiverProfile() {
  return useQuery({
    queryKey: qk.caregiverProfile,
    queryFn: () => caregiverService.me(),
  });
}

export function useCaregiverEarnings() {
  return useQuery({
    queryKey: qk.caregiverEarnings,
    queryFn: () => caregiverService.earnings(),
  });
}

export function useCaregiverReviews() {
  return useQuery({
    queryKey: qk.caregiverReviews,
    queryFn: () => caregiverService.reviews(),
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => caregiverService.requestPayout(),
    onSuccess: (res) => {
      // Reflect the request immediately so the earnings screen updates without
      // waiting for the refetch, then invalidate to reconcile with the server.
      qc.setQueryData<ApiCaregiverEarnings>(qk.caregiverEarnings, (old) =>
        old
          ? {
              ...old,
              availableGhs: 0,
              requestedGhs: old.requestedGhs + res.totalGhs,
              recentTransactions: old.recentTransactions.map((t) =>
                t.status === "available" ? { ...t, status: "requested" } : t,
              ),
            }
          : old,
      );
      qc.invalidateQueries({ queryKey: qk.caregiverEarnings });
    },
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) =>
      caregiverService.setAvailability(isAvailable),
    onSuccess: (profile: ApiCaregiverProfile) => {
      qc.setQueryData(qk.caregiverProfile, profile);
    },
  });
}

export function useSetSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SchedulePayload) =>
      caregiverService.setSchedule(payload),
    onSuccess: (profile: ApiCaregiverProfile) => {
      qc.setQueryData(qk.caregiverProfile, profile);
    },
  });
}

export function useUpdateCaregiverProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCaregiverProfilePayload) =>
      caregiverService.updateProfile(payload),
    onSuccess: (profile: ApiCaregiverProfile) =>
      qc.setQueryData(qk.caregiverProfile, profile),
  });
}

export function useUploadCaregiverPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: PickedFile) => caregiverService.uploadPhoto(file),
    onSuccess: (profile: ApiCaregiverProfile) =>
      qc.setQueryData(qk.caregiverProfile, profile),
  });
}

export function useCaregiverDocuments() {
  return useQuery({
    queryKey: qk.caregiverDocuments,
    queryFn: () => caregiverService.documents(),
  });
}

export function useUploadCaregiverDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      type: ApiCaregiverDocumentType;
      idNumber?: string;
      file: PickedFile;
    }) => caregiverService.uploadDocument(params),
    onSuccess: (_doc: ApiCaregiverDocument) => {
      qc.invalidateQueries({ queryKey: qk.caregiverDocuments });
      qc.invalidateQueries({ queryKey: qk.caregiverProfile });
    },
  });
}
