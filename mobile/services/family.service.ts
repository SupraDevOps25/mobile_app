import { api } from "@/lib/api";

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
}

export interface UpdateFamilyPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
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
