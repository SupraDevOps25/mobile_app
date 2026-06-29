import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  caregiverService,
  type ApiCaregiverProfile,
  type SchedulePayload,
} from "@/services/caregiver.service";

export function useCaregiverProfile() {
  return useQuery({
    queryKey: qk.caregiverProfile,
    queryFn: () => caregiverService.me(),
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
