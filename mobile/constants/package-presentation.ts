import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ApiPackage, ApiPackageType } from "@/services/package.service";

// Purely presentational config the backend doesn't (and shouldn't) supply.
// The dynamic data — name, tagline, price, inclusions — comes from the API and
// is merged with this map by package type. Keep this the single source of truth
// for package visuals across the home, packages, and subscribe screens.
export type PackagePresentation = {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentBg: string;
  /** "Ideal for…" one-liner from the brochure. */
  idealFor: string;
};

export const PACKAGE_PRESENTATION: Record<ApiPackageType, PackagePresentation> = {
  WELLNESS: {
    icon: "pulse-outline",
    accent: "#2563eb",
    accentBg: "#eff6ff",
    idealFor:
      "Ideal for individuals requiring routine monitoring and preventive support.",
  },
  DAILY_ASSIST: {
    icon: "sunny-outline",
    accent: "#16a34a",
    accentBg: "#f0fdf4",
    idealFor:
      "Ideal for individuals requiring daily assistance and supervision.",
  },
  EXTENDED_ASSIST: {
    icon: "medkit-outline",
    accent: "#7c3aed",
    accentBg: "#f5f3ff",
    idealFor:
      "Ideal for individuals requiring advanced nursing support and extended supervision.",
  },
  LIVE_IN: {
    icon: "home-outline",
    accent: "#ea580c",
    accentBg: "#fff7ed",
    idealFor:
      "Ideal for individuals requiring continuous supervision and full-time support at home.",
  },
};

export function packagePresentation(type: ApiPackageType): PackagePresentation {
  return PACKAGE_PRESENTATION[type];
}

// Static display names for compact UI (e.g. the home card) that only has the
// package type and shouldn't trigger a fetch just for a label.
export const PACKAGE_LABELS: Record<ApiPackageType, string> = {
  WELLNESS: "Wellness Visits",
  DAILY_ASSIST: "Daily Assist",
  EXTENDED_ASSIST: "Extended Assist",
  LIVE_IN: "Live-In Care",
};

// The shape screens render: dynamic API data merged with the local visuals.
export type PackageView = ApiPackage & PackagePresentation;

export function toPackageView(pkg: ApiPackage): PackageView {
  return { ...pkg, ...PACKAGE_PRESENTATION[pkg.type] };
}
