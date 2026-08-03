"use client";

import {
  Card,
  CardHeader,
  PageHeader,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { useAnalytics } from "@/services/analytics/analytics.queries";
import type { SeriesPoint } from "@/services/analytics/analytics.service";
import { PACKAGE_TYPE_LABELS } from "@/services/packages/packages.types";
import { formatGhs } from "@/lib/format";

export default function AnalyticsPage() {
  const { data, isLoading, isError, error } = useAnalytics();

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Trends and breakdowns across the platform (last 6 months)."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-brand">
          <Spinner size={26} />
        </div>
      ) : isError ? (
        <Card className="text-center">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load analytics."}
          </p>
        </Card>
      ) : data ? (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Bookings per month" />
              <BarChart data={data.monthlyBookings} />
            </Card>
            <Card>
              <CardHeader title="Revenue per month" />
              <BarChart
                data={data.monthlyRevenue}
                format={(v) => formatGhs(v)}
                barClass="bg-emerald-500"
              />
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card>
              <CardHeader title="Subscriptions by status" />
              <Distribution
                rows={data.subscriptionsByStatus.map((r) => ({
                  key: r.status,
                  label: <StatusBadge status={r.status} />,
                  count: r.count,
                }))}
              />
            </Card>
            <Card>
              <CardHeader title="Caregivers by status" />
              <Distribution
                rows={data.caregiversByStatus.map((r) => ({
                  key: r.status,
                  label: <StatusBadge status={r.status} />,
                  count: r.count,
                }))}
              />
            </Card>
            <Card>
              <CardHeader title="Active plans by package" />
              <Distribution
                rows={data.packageDistribution.map((r) => ({
                  key: r.packageType,
                  label: (
                    <span className="text-sm font-medium text-ink">
                      {PACKAGE_TYPE_LABELS[r.packageType]}
                    </span>
                  ),
                  count: r.count,
                }))}
              />
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}

// Simple dependency-free vertical bar chart.
function BarChart({
  data,
  format = (v) => String(v),
  barClass = "bg-brand",
}: {
  data: SeriesPoint[];
  format?: (v: number) => string;
  barClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="mt-2 flex h-48 items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-ink">
            {d.value > 0 ? format(d.value) : ""}
          </span>
          <div className="flex w-full flex-1 items-end">
            <div
              className={`w-full rounded-t-md ${barClass}`}
              style={{ height: `${(d.value / max) * 100}%`, minHeight: 2 }}
            />
          </div>
          <span className="text-xs text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Horizontal count bars, sorted by count desc.
function Distribution({
  rows,
}: {
  rows: { key: string; label: React.ReactNode; count: number }[];
}) {
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...sorted.map((r) => r.count));
  if (sorted.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No data yet.</p>;
  }
  return (
    <div className="mt-2 space-y-3">
      {sorted.map((r) => (
        <div key={r.key}>
          <div className="mb-1 flex items-center justify-between gap-2">
            {r.label}
            <span className="text-sm font-semibold text-ink">{r.count}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-page">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
