import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationBell } from "@/components/NotificationBell";
import { CaseCard } from "@/components/coordinator/CaseCard";
import { CoordinatorLogRow } from "@/components/coordinator/CoordinatorLogRow";
import { caseAction } from "@/constants/coordinator-presentation";
import { useCoordinatorCases, useCoordinatorLogs } from "@/hooks/useCoordinator";
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
  icon,
  tint,
  bg,
  onPress,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: "48%", backgroundColor: bg, borderRadius: 18, padding: 16 }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
        >
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        <Text style={{ color: tint, fontSize: 30, fontWeight: "800" }}>{value}</Text>
      </View>
      <Text style={{ color: tint, fontSize: 13, marginTop: 10, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CoordinatorHomeScreen() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const { data: cases, isLoading } = useCoordinatorCases();
  const { data: logs } = useCoordinatorLogs();

  const firstName = user?.firstName || user?.email?.split("@")[0] || "Coordinator";
  const initials = firstName.slice(0, 2).toUpperCase();

  const list = cases ?? [];
  const needsCareStart = list.filter((c) => c.status === "TEAM_ASSIGNED").length;
  const needsActivation = list.filter(
    (c) => c.status === "AWAITING_ACTIVATION",
  ).length;
  const activeCases = list.filter((c) => c.status === "ACTIVE").length;
  const allLogs = logs ?? [];
  const logsToReview = allLogs.filter((l) => !l.reviewedAt).length;
  const logsPreview = allLogs.slice(0, 3); // pending-first from the API

  const attention = list.filter((c) => caseAction(c.status) !== "NONE");
  const attentionIds = new Set(attention.map((c) => c.id));
  const recent = list.filter((c) => !attentionIds.has(c.id)).slice(0, 4);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Fixed header — content scrolls beneath it */}
      <View
        className="flex-row items-center justify-between px-5 pb-3 bg-background"
        style={{ paddingTop: top + 12 }}
      >
        <View>
          <Text className="text-muted" style={{ fontSize: 13 }}>
            {getGreeting()},
          </Text>
          <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
            {firstName}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <NotificationBell />
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
      {isLoading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Stat tiles */}
          <View className="flex-row flex-wrap px-5" style={{ gap: 12 }}>
            <StatTile
              value={needsCareStart}
              label="Set care-start"
              icon="calendar-outline"
              tint="#92400e"
              bg="#fffbeb"
              onPress={() => router.push("/(coordinator-tabs)/cases" as any)}
            />
            <StatTile
              value={needsActivation}
              label="To activate"
              icon="pulse-outline"
              tint="#1d4ed8"
              bg="#eff6ff"
              onPress={() => router.push("/(coordinator-tabs)/cases" as any)}
            />
            <StatTile
              value={logsToReview}
              label="Logs to review"
              icon="clipboard-outline"
              tint="#7c3aed"
              bg="#f5f3ff"
              onPress={() => router.push("/(coordinator-tabs)/logs" as any)}
            />
            <StatTile
              value={activeCases}
              label="Active care"
              icon="heart-outline"
              tint="#15803d"
              bg="#f0fdf4"
              onPress={() => router.push("/(coordinator-tabs)/cases" as any)}
            />
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

          {/* Daily logs preview */}
          {allLogs.length > 0 && (
            <View className="px-5 mt-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-foreground text-lg font-bold">
                  Daily logs
                  {logsToReview > 0 ? (
                    <Text style={{ color: "#0d9488" }}> · {logsToReview} to review</Text>
                  ) : null}
                </Text>
                <Pressable onPress={() => router.push("/(coordinator-tabs)/logs" as any)} hitSlop={8}>
                  <Text style={{ color: "#0d9488", fontSize: 13, fontWeight: "600" }}>
                    View all
                  </Text>
                </Pressable>
              </View>
              {logsPreview.map((log) => (
                <CoordinatorLogRow
                  key={log.visitId}
                  log={log}
                  onPress={(l) => router.push(`/coordinator-log/${l.visitId}` as any)}
                />
              ))}
            </View>
          )}

          {/* Recent cases */}
          {recent.length > 0 && (
            <View className="px-5 mt-6">
              <Text className="text-foreground text-lg font-bold mb-3">
                Recent cases
              </Text>
              {recent.map((item) => (
                <CaseCard
                  key={item.id}
                  item={item}
                  onPress={(c) => router.push(`/coordinator-case/${c.id}` as any)}
                />
              ))}
            </View>
          )}

          {/* Empty state when there are no cases at all */}
          {list.length === 0 && (
            <View className="px-5 mt-6">
              <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: "#f9fafb" }}>
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#ccfbf1" }}
                >
                  <Ionicons name="people-outline" size={26} color="#0d9488" />
                </View>
                <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
                  No cases yet
                </Text>
                <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                  When a family is matched to you, their case shows up here.
                </Text>
              </View>
            </View>
          )}
        </>
      )}
      </ScrollView>
    </View>
  );
}
