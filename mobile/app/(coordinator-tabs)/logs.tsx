import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePendingLogs, useReviewLog } from "@/hooks/useCoordinator";
import type { ApiPatientMood } from "@/services/visit.service";

const MOOD_LABEL: Record<ApiPatientMood, string> = {
  POOR: "Poor",
  LOW: "Low",
  GOOD: "Good",
  GREAT: "Great",
  EXCELLENT: "Excellent",
};

export default function CoordinatorLogsScreen() {
  const { top } = useSafeAreaInsets();
  const { data: logs, isLoading } = usePendingLogs();
  const reviewLog = useReviewLog();

  function handleReview(visitId: string) {
    reviewLog.mutate(visitId, {
      onError: (err: Error) => Alert.alert("Couldn't review", err.message),
    });
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 16, paddingHorizontal: 20, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-foreground text-2xl font-bold mb-1">Daily logs</Text>
      <Text className="text-muted text-sm mb-5">
        Review the visit logs your nurses submitted.
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#0d9488" style={{ marginVertical: 24 }} />
      ) : (logs ?? []).length === 0 ? (
        <View className="items-center" style={{ marginTop: 48 }}>
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <Ionicons name="checkmark-done-outline" size={28} color="#16a34a" />
          </View>
          <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
            All caught up
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4 }}>
            No logs are waiting for review.
          </Text>
        </View>
      ) : (
        (logs ?? []).map((log) => {
          const busy =
            reviewLog.isPending && reviewLog.variables === log.visitId;
          return (
            <View
              key={log.visitId}
              className="bg-card rounded-2xl p-4 mb-3"
              style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                  {log.clientName}
                </Text>
                <Text className="text-muted" style={{ fontSize: 11 }}>
                  {new Date(log.submittedAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
                by {log.nurseName}
              </Text>

              <Text className="text-foreground" style={{ fontSize: 13, marginTop: 8, lineHeight: 19 }}>
                {log.summary}
              </Text>

              {/* Flags */}
              <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
                {log.mood && (
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#f3f4f6" }}>
                    <Text style={{ color: "#374151", fontSize: 11, fontWeight: "600" }}>
                      Mood: {MOOD_LABEL[log.mood]}
                    </Text>
                  </View>
                )}
                {log.followUpRecommended && (
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#eff6ff" }}>
                    <Text style={{ color: "#1d4ed8", fontSize: 11, fontWeight: "600" }}>
                      Follow-up
                    </Text>
                  </View>
                )}
                {log.escalationNeeded && (
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#fef2f2" }}>
                    <Text style={{ color: "#dc2626", fontSize: 11, fontWeight: "600" }}>
                      Escalation needed
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => handleReview(log.visitId)}
                disabled={busy}
                className="rounded-xl items-center justify-center mt-4 flex-row"
                style={{ backgroundColor: busy ? "#9ca3af" : "#0d9488", paddingVertical: 12, gap: 8 }}
              >
                {busy && <ActivityIndicator color="#ffffff" size="small" />}
                <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                  Mark reviewed
                </Text>
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
