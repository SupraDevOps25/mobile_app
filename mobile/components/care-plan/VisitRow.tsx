import { Text, View } from "react-native";
import type { Visit, VisitKind, VisitStatus } from "@/constants/care";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const KIND_LABELS: Record<VisitKind, string> = {
  "initial-assessment": "Initial home visit",
  "care-visit": "Care visit",
};

const STATUS_STYLES: Record<VisitStatus, { bg: string; color: string; label: string }> = {
  scheduled: { bg: "#eef2ff", color: "#4338ca", label: "Scheduled" },
  "in-progress": { bg: "#dcfce7", color: "#16a34a", label: "In progress" },
  completed: { bg: "#f3f4f6", color: "#16a34a", label: "Completed" },
  missed: { bg: "#fee2e2", color: "#dc2626", label: "Missed" },
};

export function VisitRow({ visit }: { visit: Visit }) {
  const date = new Date(visit.date);
  const status = STATUS_STYLES[visit.status];

  return (
    <View
      className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
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
          {visit.time} · {visit.durationHrs}hrs · {visit.nurseName}
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
