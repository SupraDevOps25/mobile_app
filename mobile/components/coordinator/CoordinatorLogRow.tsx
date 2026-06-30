import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import type { ApiCoordinatorLog } from "@/services/coordinator.service";

export function CoordinatorLogRow({
  log,
  onPress,
}: {
  log: ApiCoordinatorLog;
  onPress: (log: ApiCoordinatorLog) => void;
}) {
  const reviewed = !!log.reviewedAt;

  return (
    <Pressable
      onPress={() => onPress(log)}
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
          {log.clientName}
        </Text>
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: reviewed ? "#f3f4f6" : "#ccfbf1" }}
        >
          <Text
            style={{
              color: reviewed ? "#6b7280" : "#0f766e",
              fontSize: 10,
              fontWeight: "600",
            }}
          >
            {reviewed ? "Reviewed" : "Needs review"}
          </Text>
        </View>
      </View>

      <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
        by {log.nurseName} · {new Date(log.submittedAt).toLocaleDateString()}
      </Text>

      <Text
        className="text-foreground"
        style={{ fontSize: 13, marginTop: 8, lineHeight: 19 }}
        numberOfLines={2}
      >
        {log.summary}
      </Text>

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row" style={{ gap: 6 }}>
          {log.escalationNeeded && (
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: "#fef2f2" }}>
              <Text style={{ color: "#dc2626", fontSize: 10, fontWeight: "600" }}>
                Escalation
              </Text>
            </View>
          )}
          {log.followUpRecommended && (
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: "#eff6ff" }}>
              <Text style={{ color: "#1d4ed8", fontSize: 10, fontWeight: "600" }}>
                Follow-up
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      </View>
    </Pressable>
  );
}
