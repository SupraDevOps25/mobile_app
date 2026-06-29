import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaseCard } from "@/components/coordinator/CaseCard";
import { caseAction } from "@/constants/coordinator-presentation";
import { useCoordinatorCases, usePendingLogs } from "@/hooks/useCoordinator";
import { useAuth } from "@/hooks/useAuth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatTile({
  value,
  label,
  tint,
  bg,
}: {
  value: number;
  label: string;
  tint: string;
  bg: string;
}) {
  return (
    <View className="rounded-2xl p-4" style={{ width: "48%", backgroundColor: bg }}>
      <Text style={{ color: tint, fontSize: 26, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: tint, fontSize: 12, marginTop: 2, fontWeight: "500" }}>
        {label}
      </Text>
    </View>
  );
}

export default function CoordinatorHomeScreen() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const { data: cases, isLoading } = useCoordinatorCases();
  const { data: pendingLogs } = usePendingLogs();

  const firstName = user?.firstName || user?.email?.split("@")[0] || "Coordinator";
  const initials = firstName.slice(0, 2).toUpperCase();

  const list = cases ?? [];
  const needsCareStart = list.filter((c) => c.status === "TEAM_ASSIGNED").length;
  const needsActivation = list.filter(
    (c) => c.status === "AWAITING_ACTIVATION",
  ).length;
  const activeCases = list.filter((c) => c.status === "ACTIVE").length;
  const logsToReview = pendingLogs?.length ?? 0;

  const attention = list.filter((c) => caseAction(c.status) !== "NONE");

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 mb-5">
        <View>
          <Text className="text-muted" style={{ fontSize: 13 }}>
            {getGreeting()},
          </Text>
          <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
            {firstName}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => Alert.alert("Notifications", "No new notifications.")}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={24} color="#374151" />
          </Pressable>
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "#0d9488" }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 13 }}>
              {initials}
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Stat tiles */}
          <View className="flex-row flex-wrap px-5" style={{ gap: 12 }}>
            <StatTile value={needsCareStart} label="Set care-start" tint="#92400e" bg="#fffbeb" />
            <StatTile value={needsActivation} label="To activate" tint="#1d4ed8" bg="#eff6ff" />
            <StatTile value={logsToReview} label="Logs to review" tint="#7c3aed" bg="#f5f3ff" />
            <StatTile value={activeCases} label="Active cases" tint="#15803d" bg="#f0fdf4" />
          </View>

          {/* Needs attention */}
          <View className="px-5 mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground text-lg font-bold">
                Needs your attention
              </Text>
              <Pressable onPress={() => router.push("/(coordinator-tabs)/cases" as any)} hitSlop={8}>
                <Text style={{ color: "#0d9488", fontSize: 13, fontWeight: "600" }}>
                  All cases
                </Text>
              </Pressable>
            </View>

            {attention.length === 0 ? (
              <View
                className="rounded-2xl p-5 items-center"
                style={{ backgroundColor: "#f9fafb" }}
              >
                <Ionicons name="checkmark-done-outline" size={24} color="#9ca3af" />
                <Text className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                  Nothing needs action right now.
                </Text>
              </View>
            ) : (
              attention.map((item) => (
                <CaseCard
                  key={item.id}
                  item={item}
                  onPress={(c) => router.push(`/coordinator-case/${c.id}` as any)}
                />
              ))
            )}
          </View>

          {/* Review shortcut */}
          {logsToReview > 0 && (
            <View className="px-5 mt-4">
              <Pressable
                onPress={() => router.push("/(coordinator-tabs)/logs" as any)}
                className="flex-row items-center rounded-2xl p-4"
                style={{ backgroundColor: "#f5f3ff" }}
              >
                <Ionicons name="document-text-outline" size={20} color="#7c3aed" />
                <Text style={{ color: "#6d28d9", fontSize: 14, fontWeight: "600", marginLeft: 10, flex: 1 }}>
                  {logsToReview} daily {logsToReview === 1 ? "log" : "logs"} awaiting review
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#7c3aed" />
              </Pressable>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
