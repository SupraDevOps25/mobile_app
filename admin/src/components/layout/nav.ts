import {
  AnalyticsIcon,
  BellIcon,
  BookingsIcon,
  CaregiversIcon,
  DashboardIcon,
  FamiliesIcon,
  PackagesIcon,
  SettingsIcon,
  UsersIcon,
  VisitsIcon,
  WalletIcon,
} from "@/components/icons";

// Single source of truth for the sidebar nav — keep routes and labels here so
// the sidebar and any breadcrumbs stay in sync.
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Bookings", href: "/bookings", icon: BookingsIcon },
  { label: "Families", href: "/families", icon: FamiliesIcon },
  { label: "Caregivers", href: "/caregivers", icon: CaregiversIcon },
  { label: "Users", href: "/users", icon: UsersIcon },
  { label: "Visits", href: "/visits", icon: VisitsIcon },
  { label: "Payouts", href: "/payouts", icon: WalletIcon },
  { label: "Packages", href: "/packages", icon: PackagesIcon },
  { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
  { label: "Notifications", href: "/notifications", icon: BellIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
] as const;
