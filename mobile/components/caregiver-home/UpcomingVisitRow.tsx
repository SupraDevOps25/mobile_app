import { Pressable, Text, View } from "react-native";
import type { UpcomingVisit } from "@/constants/caregiver-dashboard";

type Props = {
  visit: UpcomingVisit;
  onPress: (visit: UpcomingVisit) => void;
};

export function UpcomingVisitRow({ visit, onPress }: Props) {
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
          {visit.dayOfMonth}
        </Text>
        <Text style={{ color: "#1e3a8a", fontSize: 9, fontWeight: "600" }}>
          {visit.month}
        </Text>
      </View>

      <View className="flex-1 ml-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 14 }}>
          {visit.familyName}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
          {visit.careType} · {visit.time} · {visit.durationHrs}hrs
        </Text>
      </View>

      <View
        className="rounded-full px-2.5 py-1"
        style={{ backgroundColor: "#eef2ff" }}
      >
        <Text style={{ color: "#1e3a8a", fontSize: 11, fontWeight: "600" }}>
          {visit.tag}
        </Text>
      </View>
    </Pressable>
  );
}
