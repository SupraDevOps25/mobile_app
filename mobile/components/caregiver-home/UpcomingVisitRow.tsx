import { VisitRowCard, type VisitRowBadge } from "@/components/ui/VisitRowCard";
import type { ApiVisitRow, ApiVisitKind } from "@/services/visit.service";

const KIND_TAGS: Record<ApiVisitKind, string> = {
  INITIAL_ASSESSMENT: "Assessment",
  CARE_VISIT: "Care visit",
};

type Props = {
  visit: ApiVisitRow;
  onPress: (visit: ApiVisitRow) => void;
};

// Nurse dashboard adapter: maps a visit row into the shared VisitRowCard.
export function UpcomingVisitRow({ visit, onPress }: Props) {
  const time = new Date(visit.scheduledFor).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const badge: VisitRowBadge =
    visit.status === "IN_PROGRESS"
      ? { label: "In progress", color: "#15803d", bg: "#f0fdf4", dot: true }
      : { label: KIND_TAGS[visit.kind], color: "#1e3a8a", bg: "#eef2ff" };

  return (
    <VisitRowCard
      dateISO={visit.scheduledFor}
      title={visit.clientName}
      subtitle={`${visit.area} · ${time} · ${visit.durationHrs}hrs`}
      badge={badge}
      onPress={() => onPress(visit)}
    />
  );
}
