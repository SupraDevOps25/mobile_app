import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { initialsOf } from "@/lib/avatar";
import type { ApiCoordinatorLog } from "@/services/coordinator.service";

export function CoordinatorLogRow({
  log,
  onPress,
}: {
  log: ApiCoordinatorLog;
  onPress: (log: ApiCoordinatorLog) => void;
}) {
  const reviewed = !!log.reviewedAt;
  const status = log.changesRequested
    ? { label: "Changes requested", color: "#dc2626", bg: "#fef2f2" }
    : reviewed
      ? { label: "Reviewed", color: "#15803d", bg: "#f0fdf4" }
      : { label: "Needs review", color: "#0f766e", bg: "#ccfbf1" };

  return (
    <Pressable
      onPress={() => onPress(log)}
      style={({ pressed }) => ({
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: reviewed ? "#eef0f3" : "#a7f3d0",
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        shadowColor: "#0f172a",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      })}
    >
      {/* Client + status */}
      <View className="flex-row items-center">
        <Avatar
          name={log.clientName}
          initials={initialsOf(log.clientName)}
          photoUrl={log.clientPhotoUrl}
          size={42}
        />
        <View className="flex-1 ml-3" style={{ minWidth: 0 }}>
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            {log.clientName}
          </Text>
          <View className="flex-row items-center" style={{ marginTop: 2, gap: 5, minWidth: 0 }}>
            <Avatar
              name={log.nurseName}
              initials={initialsOf(log.nurseName)}
              photoUrl={log.nursePhotoUrl}
              size={16}
            />
            <Text className="text-muted" style={{ fontSize: 12, flexShrink: 1 }}>
              {log.nurseName} · {new Date(log.submittedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: status.bg, flexShrink: 0 }}
        >
          <Text style={{ color: status.color, fontSize: 10, fontWeight: "700" }}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Summary */}
      <Text
        className="text-foreground"
        style={{ fontSize: 13, marginTop: 10, lineHeight: 19 }}
        numberOfLines={2}
      >
        {log.summary}
      </Text>

      {/* Flags + affordance */}
      <View className="flex-row items-center justify-between mt-2.5">
        <View className="flex-row" style={{ gap: 6, flexShrink: 1, minWidth: 0 }}>
          {log.escalationNeeded && (
            <View className="flex-row items-center rounded-full px-2 py-0.5" style={{ backgroundColor: "#fef2f2", gap: 3 }}>
              <Ionicons name="warning" size={10} color="#dc2626" />
              <Text style={{ color: "#dc2626", fontSize: 10, fontWeight: "600" }}>
                Escalation
              </Text>
            </View>
          )}
          {log.followUpRecommended && (
            <View className="flex-row items-center rounded-full px-2 py-0.5" style={{ backgroundColor: "#eff6ff", gap: 3 }}>
              <Ionicons name="repeat" size={10} color="#1d4ed8" />
              <Text style={{ color: "#1d4ed8", fontSize: 10, fontWeight: "600" }}>
                Follow-up
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center" style={{ gap: 6, flexShrink: 0 }}>
          <Text style={{ color: "#0d9488", fontSize: 12, fontWeight: "700" }}>
            {reviewed ? "View" : "Review"}
          </Text>
          <View
            className="w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <Ionicons name="chevron-forward" size={15} color="#0d9488" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
