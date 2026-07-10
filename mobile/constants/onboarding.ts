export const CARE_TAGS = [
  { label: "Elderly Care", bg: "#DBEAFE", color: "#1d4ed8" },
  { label: "Recovery Care", bg: "#D1FAE5", color: "#065f46" },
  { label: "Wound Care ", bg: "#BFDBFE", color: "#1e40af" },
  { label: "Wellness Checks ", bg: "#DBEAFE", color: "#1d4ed8" },
  { label: "Catheter Care ", bg: "#99F6E4", color: "#134e4a" },
  { label: "Patient Escort Services ", bg: "#BFDBFE", color: "#1e40af" },
] as const;

export const FEATURES = [
  {
    title: "Fast Matching",
    desc: "Get matched with a qualified caregiver within minutes",
    iconBg: "#FEF3C7",
    icon: "⚡",
  },
  {
    title: "Verified Pros",
    desc: "All caregivers are background-checked and certified",
    iconBg: "#D1FAE5",
    icon: "✓",
  },
  {
    title: "Always Available",
    desc: "24/7 scheduling and support for your family",
    iconBg: "#DBEAFE",
    icon: "🗓",
  },
] as const;

export const SCHEDULE_TAGS = [
  {
    label: "Flexible schedule",
    icon: "calendar-outline",
    bg: "#DCFCE7",
    color: "#15803d",
  },
  {
    label: "Verified & secure",
    icon: "heart-outline",
    bg: "#FEF3C7",
    color: "#b45309",
  },
  {
    label: "Work nearby",
    icon: "location-outline",
    bg: "#DBEAFE",
    color: "#1d4ed8",
  },
] as const;

export const SCHEDULE_PROTECTIONS = [
  "You control your availability",
  "Set max visits per day to manage workload",
  "Get Verified before being matched with a family",
] as const;
