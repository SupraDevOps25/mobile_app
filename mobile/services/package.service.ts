import { api } from "@/lib/api";

export type ApiPackageType =
  | "WELLNESS"
  | "DAILY_ASSIST"
  | "EXTENDED_ASSIST"
  | "LIVE_IN";

export interface ApiPackage {
  type: ApiPackageType;
  name: string;
  tagline: string;
  priceGhs: number;
  inclusions: string[];
}

export const packageService = {
  list: () => api.get<ApiPackage[]>("/packages"),
  get: (type: ApiPackageType) => api.get<ApiPackage>(`/packages/${type}`),
  // Family: no catalog package fits — forward the need to the admins by email.
  requestCustom: (message: string) =>
    api.post<{ ok: boolean }>("/packages/requests", { message }),
};
