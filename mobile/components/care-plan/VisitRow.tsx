import { Text, View } from "react-native";
import { CARD_SURFACE } from "@/components/ui/AppCard";
import type {
  ApiCarePlanVisit,
  ApiVisitKind,
  ApiVisitStatus,
} from "@/services/visit.service";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const KIND_LABELS: Record<ApiVisitKind, string> = {
  INITIAL_ASSESSMENT: "Initial home visit",
  CARE_VISIT: "Care visit",
};

const STATUS_STYLES: Record<
  ApiVisitStatus,
  { bg: string; color: string; label: string }
> = {
  SCHEDULED: { bg: "#eef2ff", color: "#4338ca", label: "Scheduled" },
  IN_PROGRESS: { bg: "#dcfce7", color: "#16a34a", label: "In progress" },
  COMPLETED: { bg: "#f3f4f6", color: "#16a34a", label: "Completed" },
  MISSED: { bg: "#fee2e2", color: "#dc2626", label: "Missed" },
};

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VisitRow({ visit }: { visit: ApiCarePlanVisit }) {
  const date = new Date(visit.scheduledFor);
  const status = STATUS_STYLES[visit.status];

  return (
    <View
      className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
      style={CARD_SURFACE}
    >
      <View
        className="rounded-xl items-center justify-center"
        style={{ width: 48, height: 48, backgroundColor: "#eef2ff" }}
      >
        <Text style={{ color: "#1e3a8a", fontSize: 16, fontWeight: "700" }}>
          {date.getDate()}
        </Text>
        <Text style={{ color: "#1e3a8a", fontSize: 9, fontWeight: "600" }}>
          {MONTHS[date.getMonth()]}
        </Text>
      </View>

      <View className="flex-1 ml-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 14 }}>
          {KIND_LABELS[visit.kind]}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
          {timeLabel(visit.scheduledFor)} · {visit.durationHrs}hrs ·{" "}
          {visit.nurseName}
        </Text>
      </View>

      <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: status.bg }}>
        <Text style={{ color: status.color, fontSize: 10, fontWeight: "600" }}>
          {status.label}
        </Text>
      </View>
    </View>
  );
}
