"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Spinner,
  StatCard,
  StatusBadge,
  Tabs,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
} from "@/components/ui";
import {
  useCoordinatorPayouts,
  useMarkCoordinatorPaid,
  useMarkNursePaid,
  useNursePayouts,
} from "@/services/payouts/payouts.queries";
import type {
  PayoutKind,
  PayoutRow,
  PayoutStatus,
} from "@/services/payouts/payouts.types";
import { formatDate, formatGhs, formatPeriod } from "@/lib/format";
import { MdOutlinePendingActions } from "react-icons/md";
import { GrMoney } from "react-icons/gr";
import { GiReceiveMoney } from "react-icons/gi";




type StatusFilter = PayoutStatus | "ALL";
type KindFilter = PayoutKind | "ALL";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
];

const KIND_TABS: { label: string; value: KindFilter }[] = [
  { label: "Everyone", value: "ALL" },
  { label: "Nurses", value: "nurse" },
  { label: "Coordinators", value: "coordinator" },
];

export default function PayoutsPage() {
  const [status, setStatus] = useState<StatusFilter>("PENDING");
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [actingId, setActingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const nurse = useNursePayouts();
  const coordinator = useCoordinatorPayouts();
  const markNurse = useMarkNursePaid();
  const markCoordinator = useMarkCoordinatorPaid();

  const isLoading = nurse.isLoading || coordinator.isLoading;
  const isError = nurse.isError || coordinator.isError;
  const loadError = nurse.error ?? coordinator.error;

  // Merge both payout sources into one normalized, newest-first list.
  const rows = useMemo<PayoutRow[]>(() => {
    const nurseRows: PayoutRow[] = (nurse.data ?? []).map((p) => ({
      id: p.id,
      kind: "nurse",
      payeeName: p.nurseName,
      payeePhone: p.nursePhone,
      recipientName: p.recipientName,
      amountGhs: p.amountGhs,
      status: p.status,
      requestedAt: p.requestedAt,
      paidAt: p.paidAt,
      billingPeriodStart: p.billingPeriodStart,
      billingPeriodEnd: p.billingPeriodEnd,
    }));
    const coordinatorRows: PayoutRow[] = (coordinator.data ?? []).map((p) => ({
      id: p.id,
      kind: "coordinator",
      payeeName: p.coordinatorName,
      payeePhone: p.coordinatorPhone,
      recipientName: p.recipientName,
      amountGhs: p.amountGhs,
      status: p.status,
      requestedAt: p.requestedAt,
      paidAt: p.paidAt,
      billingPeriodStart: p.billingPeriodStart,
      billingPeriodEnd: p.billingPeriodEnd,
    }));
    return [...nurseRows, ...coordinatorRows].sort((a, b) =>
      b.requestedAt.localeCompare(a.requestedAt),
    );
  }, [nurse.data, coordinator.data]);

  const summary = useMemo(() => {
    let pendingCount = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    for (const r of rows) {
      if (r.status === "PENDING") {
        pendingCount += 1;
        pendingAmount += r.amountGhs;
      } else {
        paidAmount += r.amountGhs;
      }
    }
    return { pendingCount, pendingAmount, paidAmount };
  }, [rows]);

  const statusTabs = useMemo(() => {
    const byKind =
      kind === "ALL" ? rows : rows.filter((r) => r.kind === kind);
    const counts: Record<string, number> = { ALL: byKind.length };
    for (const r of byKind) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return STATUS_TABS.map((t) => ({ ...t, count: counts[t.value] ?? 0 }));
  }, [rows, kind]);

  const visibleRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          (kind === "ALL" || r.kind === kind) &&
          (status === "ALL" || r.status === status),
      ),
    [rows, kind, status],
  );

  async function markPaid(row: PayoutRow) {
    setActingId(row.id);
    setErrorMsg(null);
    try {
      if (row.kind === "nurse") await markNurse.mutateAsync(row.id);
      else await markCoordinator.mutateAsync(row.id);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Couldn't mark this payout paid.",
      );
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle="Review payout requests and mark them disbursed once you've paid the nurse or coordinator."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending requests"
          value={String(summary.pendingCount)}
          tint="amber"
          icon={<MdOutlinePendingActions className="size-6" />} 
        />
        <StatCard
          label="Pending amount"
          value={formatGhs(summary.pendingAmount)}
          tint="blue"
          icon={<GrMoney className="size-6" />} 
        />
        <StatCard
          label="Paid out (all time)"
          value={formatGhs(summary.paidAmount)}
          tint="green"
          icon={<GiReceiveMoney className="size-6" />} 
        />
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-2">
          <Tabs tabs={statusTabs} value={status} onChange={setStatus} />
          <div className="flex gap-1 pb-2">
            {KIND_TABS.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant={kind === t.value ? "subtle" : "ghost"}
                onClick={() => setKind(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <p className="mx-4 mt-2 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMsg}
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-brand">
            <Spinner size={26} />
          </div>
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-red-600">
            {loadError instanceof Error
              ? loadError.message
              : "Failed to load payouts."}
          </p>
        ) : visibleRows.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted">
            No payouts in this view.
          </p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Payee</Th>
                <Th>Care recipient</Th>
                <Th>Period</Th>
                <Th>Amount</Th>
                <Th>Requested</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visibleRows.map((r) => (
                <Tr key={`${r.kind}-${r.id}`}>
                  <Td>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink">{r.payeeName}</p>
                        <Badge tone={r.kind === "nurse" ? "blue" : "brand"}>
                          {r.kind === "nurse" ? "Nurse" : "Coordinator"}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted">
                        {r.payeePhone}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-muted">{r.recipientName}</Td>
                  <Td className="text-muted">
                    {formatPeriod(r.billingPeriodStart, r.billingPeriodEnd)}
                  </Td>
                  <Td className="font-semibold text-ink">
                    {formatGhs(r.amountGhs)}
                  </Td>
                  <Td className="text-muted">{formatDate(r.requestedAt)}</Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td className="text-right">
                    {r.status === "PENDING" ? (
                      <Button
                        size="sm"
                        loading={actingId === r.id}
                        disabled={actingId !== null}
                        onClick={() => markPaid(r)}
                      >
                        Mark paid
                      </Button>
                    ) : (
                      <span className="text-xs text-muted">
                        Paid {formatDate(r.paidAt)}
                      </span>
                    )}
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
