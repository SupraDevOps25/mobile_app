"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
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
import {
  useAdminVisits,
  useSetVisitStatus,
} from "@/services/visits/visits.queries";
import {
  VISIT_STATUSES,
  type VisitStatus,
} from "@/services/visits/visits.types";
import { formatDateTime } from "@/lib/format";

type StatusFilter = VisitStatus | "ALL";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Missed", value: "MISSED" },
];

const selectClass =
  "rounded-field bg-field px-2.5 py-1.5 text-sm text-ink border border-transparent transition-colors focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15";

export default function VisitsPage() {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  // Per-row chosen override, keyed by visit id (defaults to current status).
  const [choice, setChoice] = useState<Record<string, VisitStatus>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  const apiStatus = status === "ALL" ? undefined : status;
  const { data, isLoading, isError, error, isFetching } = useAdminVisits(
    apiStatus,
    debounced,
  );
  const setVisitStatus = useSetVisitStatus();

  const visits = useMemo(() => data ?? [], [data]);

  async function applyOverride(id: string, next: VisitStatus) {
    setActingId(id);
    setErrorMsg(null);
    try {
      await setVisitStatus.mutateAsync({ id, status: next });
      setChoice((c) => {
        const rest = { ...c };
        delete rest[id];
        return rest;
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Couldn't update this visit.",
      );
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Visits"
        subtitle="Find a visit and manually correct its status (e.g. undo an auto-flagged miss)."
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-field bg-field px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/15">
            <SearchIcon size={16} className="shrink-0 text-faint" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by care recipient or nurse name…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
            {isFetching && <Spinner size={14} />}
          </div>
        </div>

        <div className="px-4 pt-2">
          <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
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
            {error instanceof Error ? error.message : "Failed to load visits."}
          </p>
        ) : visits.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted">
            No visits match this view.
          </p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Care recipient</Th>
                <Th>Nurse</Th>
                <Th>Scheduled</Th>
                <Th>Duration</Th>
                <Th>Status</Th>
                <Th className="text-right">Override</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visits.map((v) => {
                const selected = choice[v.id] ?? v.status;
                const changed = selected !== v.status;
                return (
                  <Tr key={v.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">
                          {v.recipientName}
                        </span>
                        {v.kind === "ASSESSMENT" && (
                          <Badge tone="slate">Assessment</Badge>
                        )}
                      </div>
                    </Td>
                    <Td className="text-muted">{v.nurseName}</Td>
                    <Td className="text-muted">
                      {formatDateTime(v.scheduledFor)}
                    </Td>
                    <Td className="text-muted">
                      {v.durationHrs} hr{v.durationHrs === 1 ? "" : "s"}
                    </Td>
                    <Td>
                      <StatusBadge status={v.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={selected}
                          className={selectClass}
                          disabled={actingId !== null}
                          onChange={(e) =>
                            setChoice((c) => ({
                              ...c,
                              [v.id]: e.target.value as VisitStatus,
                            }))
                          }
                        >
                          {VISIT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          loading={actingId === v.id}
                          disabled={!changed || actingId !== null}
                          onClick={() => applyOverride(v.id, selected)}
                        >
                          Apply
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
