export type PackageType =
  | "WELLNESS"
  | "DAILY_ASSIST"
  | "EXTENDED_ASSIST"
  | "LIVE_IN";

// All catalog types, in display order — used to offer "create a missing one".
export const PACKAGE_TYPES: PackageType[] = [
  "WELLNESS",
  "DAILY_ASSIST",
  "EXTENDED_ASSIST",
  "LIVE_IN",
];

export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  WELLNESS: "Wellness",
  DAILY_ASSIST: "Daily Assist",
  EXTENDED_ASSIST: "Extended Assist",
  LIVE_IN: "Live-in",
};

export interface Package {
  id: string;
  type: PackageType;
  name: string;
  tagline: string;
  priceGhs: number;
  inclusions: string[];
}

export interface CreatePackageInput {
  type: PackageType;
  name: string;
  tagline: string;
  priceGhs: number;
  inclusions: string[];
}

export interface UpdatePackageInput {
  name?: string;
  tagline?: string;
  priceGhs?: number;
  inclusions?: string[];
}
