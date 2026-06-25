import type Ionicons from "@expo/vector-icons/Ionicons";

export type PackageId = "wellness" | "daily-assist" | "extended-assist" | "live-in";

export type ServicePackage = {
  id: PackageId;
  name: string;
  /** Bold cadence line shown under the name, e.g. "8-hour shift · 26 days/month" */
  tagline: string;
  priceGhsPerMonth: number;
  /** "Ideal for…" one-liner from the brochure */
  idealFor: string;
  inclusions: string[];
  /** Visual accents for package cards (data-driven styling, like SERVICES) */
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentBg: string;
};

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: "wellness",
    name: "Wellness Visits",
    tagline: "4 visits per month",
    priceGhsPerMonth: 640,
    idealFor:
      "Ideal for individuals requiring routine monitoring and preventive support.",
    inclusions: [
      "Blood pressure monitoring",
      "Blood glucose monitoring",
      "Medication reminders",
      "Wellness assessment",
      "Nutrition guidance",
      "Monthly family update",
      "Clinical oversight by Supracarer",
    ],
    icon: "pulse-outline",
    accent: "#2563eb",
    accentBg: "#eff6ff",
  },
  {
    id: "daily-assist",
    name: "Daily Assist",
    tagline: "8-hour shift · 26 days/month",
    priceGhsPerMonth: 4160,
    idealFor: "Ideal for individuals requiring daily assistance and supervision.",
    inclusions: [
      "Personal care assistance",
      "Hygiene support",
      "Feeding assistance",
      "Mobility support",
      "Medication reminders",
      "Health monitoring",
      "Companionship",
      "Safety supervision",
      "Weekly family updates",
      "Clinical oversight by Supracarer",
    ],
    icon: "sunny-outline",
    accent: "#16a34a",
    accentBg: "#f0fdf4",
  },
  {
    id: "extended-assist",
    name: "Extended Assist",
    tagline: "12-hour shift · 26 days/month",
    priceGhsPerMonth: 4940,
    idealFor:
      "Ideal for individuals requiring advanced nursing support and extended supervision.",
    inclusions: [
      "Everything in Daily Assist",
      "Wound care support",
      "Catheter care support",
      "Chronic disease monitoring",
      "Rehabilitation support",
      "Enhanced nursing assessment",
      "Escalation management",
      "Extended daytime and evening coverage",
      "Bi-weekly care reviews",
      "Clinical oversight by Supracarer",
    ],
    icon: "medkit-outline",
    accent: "#7c3aed",
    accentBg: "#f5f3ff",
  },
  {
    id: "live-in",
    name: "Live-In Care",
    tagline: "24-hour support · 30 days/month",
    priceGhsPerMonth: 7800,
    idealFor:
      "Ideal for individuals requiring continuous supervision and full-time support at home.",
    inclusions: [
      "Continuous day and night supervision",
      "Personal care assistance",
      "Daily living support",
      "Medication management",
      "Health monitoring",
      "Emergency response support",
      "Weekly family briefings",
      "Ongoing care plan reviews",
      "Clinical oversight by Supracarer",
    ],
    icon: "home-outline",
    accent: "#ea580c",
    accentBg: "#fff7ed",
  },
];

export function getPackage(id: PackageId | undefined): ServicePackage | undefined {
  if (!id) return undefined;
  return SERVICE_PACKAGES.find((p) => p.id === id);
}
