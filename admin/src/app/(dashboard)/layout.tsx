import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

// Every route in this group renders inside the guarded shell (sidebar + topbar).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
