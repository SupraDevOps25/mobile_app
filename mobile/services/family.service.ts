import { api } from "@/lib/api";
import { fileForm, type PickedFile } from "@/lib/pick";
import type { ApiGender } from "@/services/subscription.service";

export interface ApiFamilyStats {
  memberSince: string;
  carePlans: number;
  caregivers: number;
}

export interface ApiFamilyProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  memberSince: string;
  gender: ApiGender | null;
  dateOfBirth: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
}

export interface UpdateFamilyPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: ApiGender;
  dateOfBirth?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface ApiSavedAddress {
  id: string;
  label: string;
  address: string;
  area: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

export interface ApiPaymentMethod {
  id: string;
  channel: string; // "card" | "mobile_money" | "bank"
  brand: string | null;
  last4: string | null;
  bank: string | null;
  expMonth: string | null;
  expYear: string | null;
  isDefault: boolean;
}

export interface SaveAddressPayload {
  label: string;
  address: string;
  area?: string;
  city?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

export const familyService = {
  stats: () => api.get<ApiFamilyStats>("/family/stats"),
  me: () => api.get<ApiFamilyProfile>("/family/me"),
  updateMe: (payload: UpdateFamilyPayload) =>
    api.patch<ApiFamilyProfile>("/family/me", payload),
  uploadPhoto: (file: PickedFile) =>
    api.upload<ApiFamilyProfile>("/family/me/photo", fileForm(file)),
  deleteAccount: () => api.delete<{ deleted: boolean }>("/family/me"),

  addresses: () => api.get<ApiSavedAddress[]>("/family/addresses"),
  createAddress: (payload: SaveAddressPayload) =>
    api.post<ApiSavedAddress>("/family/addresses", payload),
  updateAddress: (id: string, payload: SaveAddressPayload) =>
    api.patch<ApiSavedAddress>(`/family/addresses/${id}`, payload),
  deleteAddress: (id: string) =>
    api.delete<{ id: string }>(`/family/addresses/${id}`),

  paymentMethods: () =>
    api.get<ApiPaymentMethod[]>("/family/payment-methods"),
  setDefaultPaymentMethod: (id: string) =>
    api.patch<{ id: string; isDefault: boolean }>(
      `/family/payment-methods/${id}/default`,
    ),
  deletePaymentMethod: (id: string) =>
    api.delete<{ id: string }>(`/family/payment-methods/${id}`),
};
