"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Avatar,
  Card,
  CardHeader,
  Spinner,
  StatusBadge,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
} from "@/components/ui";
import { ChevronLeftIcon } from "@/components/icons";
import { useFamily } from "@/services/families/families.queries";
import { PACKAGE_TYPE_LABELS } from "@/services/packages/packages.types";
import { formatDate, formatGhs } from "@/lib/format";

export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: family, isLoading, isError, error } = useFamily(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-brand">
        <Spinner size={28} />
      </div>
    );
  }

  if (isError || !family) {
    return (
      <Card className="text-center">
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Family not found."}
        </p>
        <Link href="/families" className="mt-3 inline-block text-sm text-brand">
          ← Back to families
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Link
        href="/families"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeftIcon size={16} />
        Families
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={family.name} size="lg" />
            <h2 className="mt-3 text-lg font-bold text-ink">{family.name}</h2>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Email" value={family.email} />
            <Row label="Phone" value={family.phone} />
            <Row
              label="Email verified"
              value={family.emailVerified ? "Yes" : "No"}
            />
            <Row label="Home area" value={family.address || "—"} />
            <Row label="Member since" value={formatDate(family.memberSince)} />
          </dl>
        </Card>

        <div className="lg:col-span-2">
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 pt-5">
              <CardHeader title={`Subscriptions (${family.subscriptions.length})`} />
            </div>
            {family.subscriptions.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">
                This family has no subscriptions yet.
              </p>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Care recipient</Th>
                    <Th>Package</Th>
                    <Th>Coordinator</Th>
                    <Th>Price</Th>
                    <Th>Started</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {family.subscriptions.map((s) => (
                    <Tr key={s.id}>
                      <Td className="font-medium text-ink">{s.recipientName}</Td>
                      <Td className="text-muted">
                        {PACKAGE_TYPE_LABELS[s.packageType]}
                      </Td>
                      <Td className="text-muted">{s.coordinatorName ?? "—"}</Td>
                      <Td className="text-muted">{formatGhs(s.priceGhs)}</Td>
                      <Td className="text-muted">{formatDate(s.startedAt)}</Td>
                      <Td>
                        <StatusBadge status={s.status} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
