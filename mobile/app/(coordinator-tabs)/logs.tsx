import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CoordinatorLogRow } from "@/components/coordinator/CoordinatorLogRow";
import { useCoordinatorLogs } from "@/hooks/useCoordinator";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 8, marginBottom: 12 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

export default function CoordinatorLogsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: logs, isLoading } = useCoordinatorLogs();

  const all = logs ?? [];
  const pending = all.filter((l) => !l.reviewedAt);
  const reviewed = all.filter((l) => l.reviewedAt);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 16, paddingHorizontal: 20, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-foreground text-2xl font-bold mb-1">Daily logs</Text>
      <Text className="text-muted text-sm mb-3">
        Review the visit logs your nurses submitted.
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#0d9488" style={{ marginVertical: 24 }} />
      ) : all.length === 0 ? (
        <View className="items-center" style={{ marginTop: 48 }}>
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <Ionicons name="document-text-outline" size={28} color="#16a34a" />
          </View>
          <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
            No logs yet
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4 }}>
            Logs appear here once your nurses submit them.
          </Text>
        </View>
      ) : (
        <>
          {/* Needs review first */}
          <SectionLabel title={`Needs review · ${pending.length}`} />
          {pending.length === 0 ? (
            <View className="rounded-2xl p-4 items-center mb-2" style={{ backgroundColor: "#f9fafb" }}>
              <Ionicons name="checkmark-done-outline" size={22} color="#9ca3af" />
              <Text className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                All caught up — nothing to review.
              </Text>
            </View>
          ) : (
            pending.map((log) => (
              <CoordinatorLogRow
                key={log.visitId}
                log={log}
                onPress={(l) => router.push(`/coordinator-log/${l.visitId}` as any)}
              />
            ))
          )}

          {/* Already reviewed */}
          {reviewed.length > 0 && (
            <>
              <SectionLabel title={`Reviewed · ${reviewed.length}`} />
              {reviewed.map((log) => (
                <CoordinatorLogRow
                  key={log.visitId}
                  log={log}
                  onPress={(l) => router.push(`/coordinator-log/${l.visitId}` as any)}
                />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
