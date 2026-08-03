"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar, Badge, Card, Spinner, StatusBadge } from "@/components/ui";
import { ChevronLeftIcon } from "@/components/icons";
import { useFamily } from "@/services/families/families.queries";
import {
  ASSIGNMENT_STATUS_TONE,
  ROLE_LABELS,
  type FamilySubscription,
} from "@/services/families/families.types";
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

        <div className="space-y-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink">
            Subscriptions ({family.subscriptions.length})
          </h3>
          {family.subscriptions.length === 0 ? (
            <Card>
              <p className="py-8 text-center text-sm text-muted">
                This family has no subscriptions yet.
              </p>
            </Card>
          ) : (
            family.subscriptions.map((s) => (
              <SubscriptionCard key={s.id} sub={s} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function SubscriptionCard({ sub }: { sub: FamilySubscription }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-ink">{sub.recipientName}</h4>
            <StatusBadge status={sub.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {PACKAGE_TYPE_LABELS[sub.packageType]} · {formatGhs(sub.priceGhs)}/mo
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>Coordinator: {sub.coordinatorName ?? "—"}</p>
          <p>Started {formatDate(sub.startedAt)}</p>
          {sub.careStartAt && <p>Care start {formatDate(sub.careStartAt)}</p>}
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
          Care team ({sub.nurses.length})
        </p>
        {sub.nurses.length === 0 ? (
          <p className="text-sm text-muted">No nurses assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {sub.nurses.map((n, i) => (
              <li key={i} className="flex items-center gap-3">
                <Avatar name={n.name} photoUrl={n.photoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {n.name}
                  </p>
                  <p className="truncate text-xs text-muted">{n.phone}</p>
                </div>
                <Badge tone="slate">{ROLE_LABELS[n.role]}</Badge>
                <Badge tone={ASSIGNMENT_STATUS_TONE[n.status]}>{n.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
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
