"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Avatar,
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
import { useCaregivers } from "@/services/caregivers/caregivers.queries";
import type { VerificationStatus } from "@/services/caregivers/caregivers.types";
import { formatDate } from "@/lib/format";

type Filter = VerificationStatus | "ALL";

const TAB_ORDER: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending review", value: "PENDING_REVIEW" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Unverified", value: "UNVERIFIED" },
];

export default function CaregiversPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data, isLoading, isError, error } = useCaregivers();

  const caregivers = useMemo(() => data ?? [], [data]);

  // Counts per status, scoped to the whole list, for the tab badges.
  const counts = useMemo(() => {
    const acc: Record<string, number> = { ALL: caregivers.length };
    for (const c of caregivers) {
      acc[c.verificationStatus] = (acc[c.verificationStatus] ?? 0) + 1;
    }
    return acc;
  }, [caregivers]);

  const rows = useMemo(
    () =>
      filter === "ALL"
        ? caregivers
        : caregivers.filter((c) => c.verificationStatus === filter),
    [caregivers, filter],
  );

  const tabs = TAB_ORDER.map((t) => ({ ...t, count: counts[t.value] ?? 0 }));

  return (
    <>
      <PageHeader
        title="Caregivers"
        subtitle="Review credentials and verify nurses so they can be matched to families."
      />

      <Card padded={false} className="overflow-hidden">
        <div className="px-4 pt-2">
          <Tabs tabs={tabs} value={filter} onChange={setFilter} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-brand">
            <Spinner size={26} />
          </div>
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load caregivers."}
          </p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted">
            No caregivers in this view.
          </p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Caregiver</Th>
                <Th>Experience</Th>
                <Th>Service areas</Th>
                <Th>Docs</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} photoUrl={c.photoUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{c.name}</p>
                        <p className="truncate text-xs text-muted">{c.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted">
                    {c.yearsExperience} yr{c.yearsExperience === 1 ? "" : "s"}
                    {c.hasHomecareExp ? " · homecare" : ""}
                  </Td>
                  <Td className="text-muted">
                    {c.serviceAreas.length ? c.serviceAreas.join(", ") : "—"}
                  </Td>
                  <Td className="text-muted">{c.documentsCount}</Td>
                  <Td className="text-muted">{formatDate(c.submittedAt)}</Td>
                  <Td>
                    <StatusBadge status={c.verificationStatus} />
                  </Td>
                  <Td className="text-right">
                    <Link href={`/caregivers/${c.id}`}>
                      <Button variant="subtle" size="sm">
                        Review
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
