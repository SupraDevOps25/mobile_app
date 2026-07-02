import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  familyService,
  type SaveAddressPayload,
  type UpdateFamilyPayload,
} from "@/services/family.service";

export function useFamilyStats() {
  return useQuery({
    queryKey: qk.familyStats,
    queryFn: () => familyService.stats(),
  });
}

export function useFamilyProfile() {
  return useQuery({
    queryKey: qk.familyProfile,
    queryFn: () => familyService.me(),
  });
}

export function useUpdateFamilyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFamilyPayload) => familyService.updateMe(payload),
    onSuccess: (profile) => {
      qc.setQueryData(qk.familyProfile, profile);
      qc.invalidateQueries({ queryKey: qk.familyStats });
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: qk.familyAddresses,
    queryFn: () => familyService.addresses(),
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveAddressPayload) =>
      familyService.createAddress(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.familyAddresses }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: SaveAddressPayload }) =>
      familyService.updateAddress(vars.id, vars.payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.familyAddresses }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familyService.deleteAddress(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.familyAddresses }),
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: qk.paymentMethods,
    queryFn: () => familyService.paymentMethods(),
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familyService.setDefaultPaymentMethod(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.paymentMethods }),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familyService.deletePaymentMethod(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.paymentMethods }),
  });
}
