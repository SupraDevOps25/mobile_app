"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  PageHeader,
  Spinner,
  StatusBadge,
  Tabs,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
} from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { useBookings } from "@/services/subscriptions/subscriptions.queries";
import type { SubscriptionStatus } from "@/services/subscriptions/subscriptions.types";
import { PACKAGE_TYPE_LABELS } from "@/services/packages/packages.types";

type StatusFilter = SubscriptionStatus | "ALL";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Matching", value: "MATCHING" },
  { label: "Team assigned", value: "TEAM_ASSIGNED" },
  { label: "Awaiting activation", value: "AWAITING_ACTIVATION" },
  { label: "Active", value: "ACTIVE" },
  { label: "Renewing", value: "RENEWING" },
  { label: "Paused", value: "PAUSED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function BookingsPage() {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  const apiStatus = status === "ALL" ? undefined : status;
  const { data, isLoading, isError, error, isFetching } = useBookings(
    apiStatus,
    debounced,
  );
  const bookings = useMemo(() => data ?? [], [data]);

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Every subscription (case) on the platform. Open one to see its full care journey."
      />

      <Card padded={false} className="overflow-hidden">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-field bg-field px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/15">
            <SearchIcon size={16} className="shrink-0 text-faint" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by family or care recipient name…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
            {isFetching && <Spinner size={14} />}
          </div>
        </div>

        <div className="px-4 pt-2">
          <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-brand">
            <Spinner size={26} />
          </div>
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load bookings."}
          </p>
        ) : bookings.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted">
            No bookings in this view.
          </p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Care recipient</Th>
                <Th>Family</Th>
                <Th>Package</Th>
                <Th>Coordinator</Th>
                <Th>Visits</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {bookings.map((b) => (
                <Tr key={b.id}>
                  <Td className="font-medium text-ink">{b.recipientName}</Td>
                  <Td className="text-muted">{b.familyName}</Td>
                  <Td className="text-muted">
                    {PACKAGE_TYPE_LABELS[b.packageType]}
                  </Td>
                  <Td className="text-muted">{b.coordinatorName ?? "—"}</Td>
                  <Td className="text-muted">{b.visitsCount}</Td>
                  <Td>
                    <StatusBadge status={b.status} />
                  </Td>
                  <Td className="text-right">
                    <Link href={`/bookings/${b.id}`}>
                      <Button variant="subtle" size="sm">
                        Open
                      </Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
