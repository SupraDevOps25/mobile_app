import {
  AnalyticsIcon,
  BellIcon,
  BookingsIcon,
  CaregiversIcon,
  DashboardIcon,
  WalletIcon,
} from "@/components/icons";

// Single source of truth for the sidebar nav — keep routes and labels here so
// the sidebar and any breadcrumbs stay in sync.
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Bookings", href: "/bookings", icon: BookingsIcon },
  { label: "Caregivers", href: "/caregivers", icon: CaregiversIcon },
  { label: "Payouts", href: "/payouts", icon: WalletIcon },
  { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
  { label: "Notifications", href: "/notifications", icon: BellIcon },
] as const;
