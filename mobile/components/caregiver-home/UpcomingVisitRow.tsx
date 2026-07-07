import { Pressable, Text, View } from "react-native";
import type { ApiVisitRow, ApiVisitKind } from "@/services/visit.service";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const KIND_TAGS: Record<ApiVisitKind, string> = {
  INITIAL_ASSESSMENT: "Assessment",
  CARE_VISIT: "Care visit",
};

type Props = {
  visit: ApiVisitRow;
  onPress: (visit: ApiVisitRow) => void;
};

export function UpcomingVisitRow({ visit, onPress }: Props) {
  const date = new Date(visit.scheduledFor);
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Pressable
      onPress={() => onPress(visit)}
      className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {/* Date badge */}
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
          {visit.clientName}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
          {visit.area} · {time} · {visit.durationHrs}hrs
        </Text>
      </View>

      {visit.status === "IN_PROGRESS" ? (
        <View
          className="flex-row items-center rounded-full px-2.5 py-1"
          style={{ backgroundColor: "#f0fdf4" }}
        >
          <View
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#16a34a", marginRight: 5 }}
          />
          <Text style={{ color: "#15803d", fontSize: 11, fontWeight: "700" }}>
            In progress
          </Text>
        </View>
      ) : (
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: "#eef2ff" }}
        >
          <Text style={{ color: "#1e3a8a", fontSize: 11, fontWeight: "600" }}>
            {KIND_TAGS[visit.kind]}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
