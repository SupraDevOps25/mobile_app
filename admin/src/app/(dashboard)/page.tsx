"use client";

import { Card, PageHeader, StatCard } from "@/components/ui";

// Dashboard shell. Metric values are placeholders until the admin analytics
// endpoints are built — the layout and components are the deliverable here.
export default function DashboardPage() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader title="Good morning, Admin 👋" subtitle={today} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total bookings this month" value="—" tint="blue" />
        <StatCard label="Active caregivers" value="—" tint="green" />
        <StatCard label="Revenue this month" value="—" tint="blue" />
        <StatCard label="Pending approvals" value="—" tint="amber" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="font-semibold text-ink">Recent bookings</p>
          <p className="mt-8 text-center text-sm text-muted">
            Connects to live booking data next.
          </p>
        </Card>
        <Card>
          <p className="font-semibold text-ink">Pending approvals</p>
          <p className="mt-8 text-center text-sm text-muted">
            Caregivers awaiting verification appear here.
          </p>
        </Card>
      </div>
    </>
  );
}
