"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Modal,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { ChevronLeftIcon, SearchIcon } from "@/components/icons";
import { useCaregivers } from "@/services/caregivers/caregivers.queries";
import {
  useCase,
  useCaseActions,
} from "@/services/subscriptions/subscriptions.queries";
import { useSetVisitStatus } from "@/services/visits/visits.queries";
import { VISIT_STATUSES, type VisitStatus } from "@/services/visits/visits.types";
import {
  ASSIGNMENT_STATUS_TONE,
  ROLE_LABELS,
} from "@/services/families/families.types";
import {
  PACKAGE_TYPES,
  PACKAGE_TYPE_LABELS,
  type PackageType,
} from "@/services/packages/packages.types";
import type {
  CaseDetail,
  CasePayment,
  CaseVisit,
} from "@/services/subscriptions/subscriptions.types";
import { formatDate, formatDateTime, formatGhs, formatPeriod } from "@/lib/format";

const inputClass =
  "rounded-field bg-field px-2.5 py-1.5 text-sm text-ink border border-transparent focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15";

// ISO ⇄ <input type="datetime-local"> value (local time, minute precision).
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: c, isLoading, isError, error } = useCase(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-brand">
        <Spinner size={28} />
      </div>
    );
  }
  if (isError || !c) {
    return (
      <Card className="text-center">
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Case not found."}
        </p>
        <Link href="/bookings" className="mt-3 inline-block text-sm text-brand">
          ← Back to bookings
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Link
        href="/bookings"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeftIcon size={16} />
        Bookings
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {c.recipient.name}
            </h1>
            <StatusBadge status={c.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {c.family.name} · {c.package?.name ?? PACKAGE_TYPE_LABELS[c.packageType]}{" "}
            · {formatGhs(c.priceGhs)}/mo
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <JourneyActions caseData={c} />
          <PaymentsCard payments={c.payments} priceGhs={c.priceGhs} />
          <VisitsCard visits={c.visits} />
        </div>

        <div className="space-y-5 lg:col-span-1">
          <RecipientCard caseData={c} />
          <PackageCard caseData={c} />
          <TeamCard caseData={c} />
        </div>
      </div>
    </>
  );
}

// ── Care journey + admin adjust controls ──────────────────────────────────────
function JourneyActions({ caseData: c }: { caseData: CaseDetail }) {
  const a = useCaseActions(c.id);
  const [assessment, setAssessment] = useState(toLocalInput(c.assessmentAt));
  const [careStart, setCareStart] = useState(toLocalInput(c.careStartAt));
  const [pkg, setPkg] = useState<PackageType>(c.packageType);

  const busy =
    a.setAssessment.isPending ||
    a.completeAssessment.isPending ||
    a.setCareStart.isPending ||
    a.changePackage.isPending ||
    a.rematch.isPending ||
    a.activate.isPending ||
    a.cancel.isPending;

  const err =
    a.setAssessment.error ??
    a.completeAssessment.error ??
    a.setCareStart.error ??
    a.changePackage.error ??
    a.rematch.error ??
    a.activate.error ??
    a.cancel.error;

  return (
    <Card>
      <CardHeader title="Care journey & actions" />

      {err && (
        <p className="mb-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
          {err instanceof Error ? err.message : "Action failed."}
        </p>
      )}

      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <Fact label="Subscribed" value={formatDate(c.startedAt)} />
        <Fact
          label="Assessment"
          value={c.assessmentAt ? formatDateTime(c.assessmentAt) : "Not set"}
        />
        <Fact
          label="Care start"
          value={c.careStartAt ? formatDateTime(c.careStartAt) : "Not set"}
        />
        <Fact
          label="Activated"
          value={c.activatedAt ? formatDateTime(c.activatedAt) : "Not activated"}
        />
      </dl>

      <div className="space-y-3 border-t border-line pt-4">
        {/* Assessment date */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 text-sm text-muted">Assessment</span>
          <input
            type="datetime-local"
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            className={inputClass}
          />
          <Button
            size="sm"
            variant="subtle"
            disabled={busy || !assessment}
            loading={a.setAssessment.isPending}
            onClick={() =>
              a.setAssessment.mutate(new Date(assessment).toISOString())
            }
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            loading={a.completeAssessment.isPending}
            onClick={() => a.completeAssessment.mutate()}
          >
            Mark done
          </Button>
        </div>

        {/* Care start date */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 text-sm text-muted">Care start</span>
          <input
            type="datetime-local"
            value={careStart}
            onChange={(e) => setCareStart(e.target.value)}
            className={inputClass}
          />
          <Button
            size="sm"
            variant="subtle"
            disabled={busy || !careStart}
            loading={a.setCareStart.isPending}
            onClick={() =>
              a.setCareStart.mutate(new Date(careStart).toISOString())
            }
          >
            Save
          </Button>
        </div>

        {/* Package */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 text-sm text-muted">Package</span>
          <select
            value={pkg}
            onChange={(e) => setPkg(e.target.value as PackageType)}
            className={inputClass}
          >
            {PACKAGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {PACKAGE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="subtle"
            disabled={busy || pkg === c.packageType}
            loading={a.changePackage.isPending}
            onClick={() => a.changePackage.mutate(pkg)}
          >
            Change &amp; re-price
          </Button>
        </div>

        {/* Team + activation */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            loading={a.rematch.isPending}
            onClick={() => a.rematch.mutate()}
          >
            Re-run matching
          </Button>
          <Button
            size="sm"
            disabled={busy}
            loading={a.activate.isPending}
            onClick={() => a.activate.mutate()}
          >
            Activate care
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={busy || c.status === "CANCELLED"}
            loading={a.cancel.isPending}
            onClick={() => {
              if (
                window.confirm(
                  "Force-cancel this case? The subscription will be marked CANCELLED.",
                )
              )
                a.cancel.mutate();
            }}
          >
            {c.status === "CANCELLED" ? "Cancelled" : "Cancel case"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Visits + logs (with per-visit status override) ────────────────────────────
function VisitsCard({ visits }: { visits: CaseVisit[] }) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="px-5 pt-5">
        <CardHeader title={`Visits & logs (${visits.length})`} />
      </div>
      {visits.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">
          No visits scheduled yet — they generate when care is activated.
        </p>
      ) : (
        <div className="divide-y divide-line">
          {visits.map((v) => (
            <VisitRow key={v.id} visit={v} />
          ))}
        </div>
      )}
    </Card>
  );
}

function VisitRow({ visit: v }: { visit: CaseVisit }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<VisitStatus>(v.status);
  const setStatus = useSetVisitStatus();

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-ink">{v.nurseName}</p>
            {v.kind === "ASSESSMENT" && <Badge tone="slate">Assessment</Badge>}
            <StatusBadge status={v.status} />
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {formatDateTime(v.scheduledFor)} · {v.durationHrs} hr
            {v.durationHrs === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value as VisitStatus)}
            className={inputClass}
            disabled={setStatus.isPending}
          >
            {VISIT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="subtle"
            disabled={choice === v.status}
            loading={setStatus.isPending}
            onClick={() => setStatus.mutate({ id: v.id, status: choice })}
          >
            Set
          </Button>
          {v.log && (
            <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
              {open ? "Hide log" : "View log"}
            </Button>
          )}
        </div>
      </div>

      {setStatus.isError && (
        <p className="mt-2 text-xs text-red-600">
          {setStatus.error instanceof Error
            ? setStatus.error.message
            : "Couldn't update the visit."}
        </p>
      )}

      {open && v.log && (
        <div className="mt-3 rounded-field bg-page p-4 text-sm">
          <p className="text-ink">{v.log.summary}</p>
          {v.log.observations && (
            <p className="mt-2 text-muted">{v.log.observations}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {v.log.bloodPressure && <Vital label="BP" value={v.log.bloodPressure} />}
            {v.log.bloodGlucose && (
              <Vital label="Glucose" value={v.log.bloodGlucose} />
            )}
            {v.log.heartRate && <Vital label="HR" value={v.log.heartRate} />}
            {v.log.temperature && <Vital label="Temp" value={v.log.temperature} />}
            {v.log.mood && <Vital label="Mood" value={v.log.mood} />}
          </div>
          {v.log.medicationsGiven.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              <span className="font-semibold text-ink">Medications:</span>{" "}
              {v.log.medicationsGiven.join(", ")}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {v.log.followUpRecommended && (
              <Badge tone="amber">Follow-up recommended</Badge>
            )}
            {v.log.escalationNeeded && <Badge tone="red">Escalation needed</Badge>}
            {v.log.changesRequested && (
              <Badge tone="amber">Changes requested</Badge>
            )}
            <Badge tone={v.log.reviewedAt ? "green" : "gray"}>
              {v.log.reviewedAt ? "Reviewed" : "Awaiting review"}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-faint">
            Submitted {formatDateTime(v.log.submittedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-ink shadow-sm">
      <span className="text-muted">{label}:</span> {value}
    </span>
  );
}

// ── Billing / payments ────────────────────────────────────────────────────────
const PAYMENT_TONE: Record<CasePayment["status"], "green" | "amber" | "red" | "gray"> =
  {
    SUCCESS: "green",
    PENDING: "amber",
    FAILED: "red",
    ABANDONED: "gray",
  };

function PaymentsCard({
  payments,
  priceGhs,
}: {
  payments: CasePayment[];
  priceGhs: number;
}) {
  const paid = payments.filter((p) => p.status === "SUCCESS").length;
  const outstanding = payments
    .filter((p) => p.status !== "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <CardHeader title={`Billing (${payments.length} month${payments.length === 1 ? "" : "s"})`} />
        <p className="pb-3 text-sm text-muted">
          {paid} paid · {formatGhs(outstanding)} outstanding · {formatGhs(priceGhs)}
          /mo
        </p>
      </div>
      {payments.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">
          No invoices yet — the coordinator issues these month by month.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {formatPeriod(p.billingPeriodStart, p.billingPeriodEnd)}
                </p>
                <p className="text-xs text-muted">
                  {formatGhs(p.amount)}
                  {p.paidAt ? ` · paid ${formatDate(p.paidAt)}` : ""}
                </p>
              </div>
              <Badge tone={PAYMENT_TONE[p.status]}>
                {p.status === "SUCCESS" ? "Paid" : p.status.toLowerCase()}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ── Right column cards ────────────────────────────────────────────────────────
function RecipientCard({ caseData: c }: { caseData: CaseDetail }) {
  const actions = useCaseActions(c.id);
  const [open, setOpen] = useState(false);
  const r = c.recipient;
  const [form, setForm] = useState({
    name: r.name,
    age: String(r.age),
    gender: r.gender,
    relationToAccount: r.relationToAccount,
    area: r.area,
    city: r.city,
    address: r.address,
    conditions: r.conditions.join(", "),
    basicCareNeeds: r.basicCareNeeds,
  });

  function openEdit() {
    setForm({
      name: r.name,
      age: String(r.age),
      gender: r.gender,
      relationToAccount: r.relationToAccount,
      area: r.area,
      city: r.city,
      address: r.address,
      conditions: r.conditions.join(", "),
      basicCareNeeds: r.basicCareNeeds,
    });
    actions.updateRecipient.reset();
    setOpen(true);
  }

  async function save() {
    await actions.updateRecipient
      .mutateAsync({
        name: form.name.trim(),
        age: Number(form.age) || 0,
        gender: form.gender,
        relationToAccount: form.relationToAccount.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        conditions: form.conditions
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        basicCareNeeds: form.basicCareNeeds.trim(),
      })
      .then(() => setOpen(false))
      .catch(() => undefined);
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardHeader title="Care recipient" />
        <Button size="sm" variant="subtle" onClick={openEdit}>
          Edit
        </Button>
      </div>
      <dl className="space-y-3 text-sm">
        <Fact label="Name" value={c.recipient.name} />
        <Fact label="Age" value={String(c.recipient.age)} />
        <Fact
          label="Gender"
          value={c.recipient.gender === "MALE" ? "Male" : "Female"}
        />
        <Fact label="Relation" value={c.recipient.relationToAccount} />
        <Fact
          label="Location"
          value={`${c.recipient.area}, ${c.recipient.city}`}
        />
        <Fact label="Address" value={c.recipient.address} />
      </dl>
      {c.recipient.conditions.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
            Conditions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {c.recipient.conditions.map((cond) => (
              <Badge key={cond} tone="slate">
                {cond}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {c.recipient.basicCareNeeds && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">
            Care needs
          </p>
          <p className="text-sm text-muted">{c.recipient.basicCareNeeds}</p>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Edit care recipient">
        {actions.updateRecipient.isError && (
          <p className="mb-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
            {actions.updateRecipient.error instanceof Error
              ? actions.updateRecipient.error.message
              : "Couldn't save."}
          </p>
        )}
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <Input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </Field>
            <Field label="Gender">
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gender: e.target.value as "MALE" | "FEMALE",
                  })
                }
                className="w-full rounded-field bg-field px-3.5 py-2.5 text-sm text-ink border border-transparent focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </Field>
          </div>
          <Field label="Relation to account">
            <Input
              value={form.relationToAccount}
              onChange={(e) =>
                setForm({ ...form, relationToAccount: e.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Area">
              <Input
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
            </Field>
            <Field label="City">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Conditions (comma separated)">
            <Input
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
            />
          </Field>
          <Field label="Care needs">
            <textarea
              rows={3}
              value={form.basicCareNeeds}
              onChange={(e) =>
                setForm({ ...form, basicCareNeeds: e.target.value })
              }
              className="w-full rounded-field bg-field px-3.5 py-2.5 text-sm text-ink border border-transparent focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={actions.updateRecipient.isPending}
            >
              Cancel
            </Button>
            <Button onClick={save} loading={actions.updateRecipient.isPending}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function PackageCard({ caseData: c }: { caseData: CaseDetail }) {
  return (
    <Card>
      <CardHeader title="Package" />
      <div className="flex items-baseline justify-between">
        <p className="font-bold text-ink">
          {c.package?.name ?? PACKAGE_TYPE_LABELS[c.packageType]}
        </p>
        <p className="text-sm font-semibold text-ink">
          {formatGhs(c.priceGhs)}/mo
        </p>
      </div>
      {c.package?.tagline && (
        <p className="mt-1 text-sm text-muted">{c.package.tagline}</p>
      )}
      <p className="mt-2 text-xs text-muted">
        Coordinator fee: {formatGhs(c.coordinatorFeeGhs)}/mo
      </p>
      {c.package && c.package.inclusions.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
          {c.package.inclusions.map((inc, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted">
              <span className="text-brand">•</span>
              {inc}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TeamCard({ caseData: c }: { caseData: CaseDetail }) {
  const actions = useCaseActions(c.id);
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const { data: caregivers, isLoading } = useCaregivers();

  const verified = (caregivers ?? []).filter(
    (cg) => cg.verificationStatus === "VERIFIED",
  );
  const q = term.trim().toLowerCase();
  const results = q
    ? verified.filter(
        (cg) =>
          cg.name.toLowerCase().includes(q) ||
          cg.email.toLowerCase().includes(q),
      )
    : verified;

  async function assign(caregiverId: string) {
    await actions.reassignNurse
      .mutateAsync(caregiverId)
      .then(() => setOpen(false))
      .catch(() => undefined);
  }

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <CardHeader title={`Care team (${c.team.length})`} />
        <Button
          size="sm"
          variant="subtle"
          onClick={() => {
            setTerm("");
            actions.reassignNurse.reset();
            setOpen(true);
          }}
        >
          Assign nurse
        </Button>
      </div>
      <p className="mb-3 text-xs text-muted">
        Coordinator: {c.coordinator?.name ?? "—"}
        {c.coordinator?.phone ? ` · ${c.coordinator.phone}` : ""}
      </p>
      {c.team.length === 0 ? (
        <p className="text-sm text-muted">No nurses matched yet.</p>
      ) : (
        <ul className="space-y-2">
          {c.team.map((n, i) => (
            <li key={i} className="flex items-center gap-3">
              <Avatar name={n.name} photoUrl={n.photoUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{n.name}</p>
                <p className="truncate text-xs text-muted">{n.phone}</p>
              </div>
              <Badge tone="slate">{ROLE_LABELS[n.role]}</Badge>
              <Badge tone={ASSIGNMENT_STATUS_TONE[n.status]}>{n.status}</Badge>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Assign a nurse (lead)">
        <p className="mb-3 text-sm text-muted">
          Assigns a verified nurse as the lead and moves upcoming visits to them.
        </p>
        {actions.reassignNurse.isError && (
          <p className="mb-3 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
            {actions.reassignNurse.error instanceof Error
              ? actions.reassignNurse.error.message
              : "Couldn't assign that nurse."}
          </p>
        )}
        <div className="mb-3 flex items-center gap-2 rounded-field bg-field px-3 py-2">
          <SearchIcon size={16} className="shrink-0 text-faint" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search verified nurses…"
            className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
          />
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8 text-brand">
            <Spinner size={22} />
          </div>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No verified nurses match.
          </p>
        ) : (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {results.map((cg) => (
              <li
                key={cg.id}
                className="flex items-center gap-3 py-2.5"
              >
                <Avatar name={cg.name} photoUrl={cg.photoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {cg.name}
                  </p>
                  <p className="truncate text-xs text-muted">{cg.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="subtle"
                  loading={
                    actions.reassignNurse.isPending &&
                    actions.reassignNurse.variables === cg.id
                  }
                  disabled={actions.reassignNurse.isPending}
                  onClick={() => assign(cg.id)}
                >
                  Assign
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
