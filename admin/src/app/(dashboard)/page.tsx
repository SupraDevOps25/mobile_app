"use client";

import Link from "next/link";
import {
  Avatar,
  Card,
  PageHeader,
  Spinner,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiHeadphones,
  FiHeart,
  FiRepeat,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { useDashboardStats } from "@/services/stats/stats.queries";
import { PACKAGE_TYPE_LABELS } from "@/services/packages/packages.types";
import { formatDate, formatGhs } from "@/lib/format";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const { data, isLoading, isError, error } = useDashboardStats();

  return (
    <>
      <PageHeader title="Welcome back, Admin 👋" subtitle={today} />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-brand">
          <Spinner size={26} />
        </div>
      ) : isError ? (
        <Card className="text-center">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load stats."}
          </p>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Bookings this month"
              value={String(data.bookingsThisMonth)}
              tint="blue"
              icon={<FiCalendar className="size-5" />}
            />
            <StatCard
              label="Active caregivers"
              value={String(data.activeCaregivers)}
              tint="green"
              icon={<FiUserCheck className="size-5" />}
            />
            <StatCard
              label="Revenue this month"
              value={formatGhs(data.revenueThisMonthGhs)}
              tint="violet"
              icon={<FiDollarSign className="size-5" />}
            />
            <StatCard
              label="Pending approvals"
              value={String(data.pendingApprovals)}
              tint="amber"
              icon={<FiClock className="size-5" />}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Families"
              value={String(data.totals.families)}
              tint="blue"
              icon={<FiUsers className="size-5" />}
            />
            <StatCard
              label="Nurses"
              value={String(data.totals.caregivers)}
              tint="green"
              icon={<FiHeart className="size-5" />}
            />
            <StatCard
              label="Coordinators"
              value={String(data.totals.coordinators)}
              tint="violet"
              icon={<FiHeadphones className="size-5" />}
            />
            <StatCard
              label="Active subscriptions"
              value={String(data.totals.activeSubscriptions)}
              tint="amber"
              icon={<FiRepeat className="size-5" />}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card padded={false} className="overflow-hidden lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-line bg-blue-50 px-5 py-3.5">
                <FiCalendar className="size-4 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Recent bookings</h3>
              </div>
              {data.recentBookings.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted">
                  No bookings yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.recentBookings.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/bookings/${b.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-page"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">
                            {b.recipientName}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {b.familyName} · {PACKAGE_TYPE_LABELS[b.packageType]}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="hidden text-xs text-muted sm:inline">
                            {formatDate(b.createdAt)}
                          </span>
                          <StatusBadge status={b.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padded={false} className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line bg-amber-50 px-5 py-3.5">
                <FiClock className="size-4 text-amber-600" />
                <h3 className="font-semibold text-amber-900">
                  Pending approvals
                </h3>
              </div>
              {data.pendingCaregivers.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted">
                  No caregivers awaiting verification.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.pendingCaregivers.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/caregivers/${c.id}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-page"
                      >
                        <Avatar name={c.name} photoUrl={c.photoUrl} size="sm" />
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                          {c.name}
                        </p>
                        <span className="shrink-0 text-xs text-muted">
                          {formatDate(c.submittedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </>
  );
}
