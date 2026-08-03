import {
  AnalyticsIcon,
  BellIcon,
  CaregiversIcon,
  DashboardIcon,
  FamiliesIcon,
  PackagesIcon,
  VisitsIcon,
  WalletIcon,
} from "@/components/icons";

// Single source of truth for the sidebar nav — keep routes and labels here so
// the sidebar and any breadcrumbs stay in sync.
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Families", href: "/families", icon: FamiliesIcon },
  { label: "Caregivers", href: "/caregivers", icon: CaregiversIcon },
  { label: "Visits", href: "/visits", icon: VisitsIcon },
  { label: "Payouts", href: "/payouts", icon: WalletIcon },
  { label: "Packages", href: "/packages", icon: PackagesIcon },
  { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
  { label: "Notifications", href: "/notifications", icon: BellIcon },
] as const;
