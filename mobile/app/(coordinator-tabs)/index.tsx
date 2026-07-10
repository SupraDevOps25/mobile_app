import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationBell } from "@/components/NotificationBell";
import { CaseCard } from "@/components/coordinator/CaseCard";
import { CoordinatorLogRow } from "@/components/coordinator/CoordinatorLogRow";
import { Avatar } from "@/components/ui/Avatar";
import { caseAction } from "@/constants/coordinator-presentation";
import {
  useCoordinatorCases,
  useCoordinatorLogs,
  useCoordinatorProfile,
} from "@/hooks/useCoordinator";
import { useAuth } from "@/hooks/useAuth";
import { initialsOf } from "@/lib/avatar";

// True when an ISO timestamp falls in the current calendar month.
function inThisMonth(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

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
  border,
  monthValue,
  monthLabel,
  onPress,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  border: string;
  monthValue: number;
  monthLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: "48%",
        backgroundColor: bg,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        shadowColor: "#0f172a",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      })}
    >
      <View className="flex-row items-start justify-between">
        <View
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
        >
          <Ionicons name={icon} size={19} color={tint} />
        </View>
        <Ionicons
          name="arrow-forward"
          size={15}
          color={tint}
          style={{ opacity: 0.45, marginTop: 2 }}
        />
      </View>
      <Text style={{ color: tint, fontSize: 26, fontWeight: "800", marginTop: 8 }}>
        {value}
      </Text>
      <Text
        style={{ color: tint, fontSize: 12, marginTop: 1, fontWeight: "700", opacity: 0.85 }}
      >
        {label}
      </Text>

      {/* This-month sub-metric */}
      <View
        className="flex-row items-center"
        style={{
          marginTop: 9,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: border,
        }}
      >
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 17, height: 17, backgroundColor: "rgba(255,255,255,0.7)" }}
        >
          <Ionicons name="trending-up" size={11} color={tint} />
        </View>
        <Text
          style={{ color: tint, fontSize: 10.5, fontWeight: "700", marginLeft: 6, opacity: 0.9 }}
          numberOfLines={1}
        >
          {monthValue} {monthLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export default function CoordinatorHomeScreen() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const { data: cases, isLoading } = useCoordinatorCases();
  const { data: logs } = useCoordinatorLogs();
  const { data: profile } = useCoordinatorProfile();

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "";
  const firstName =
    profile?.firstName || user?.firstName || user?.email?.split("@")[0] || "Coordinator";
  const initials = initialsOf(fullName || firstName);

  const list = cases ?? [];
  const needsCareStart = list.filter((c) => c.status === "TEAM_ASSIGNED").length;
  const needsActivation = list.filter(
    (c) => c.status === "AWAITING_ACTIVATION",
  ).length;
  const activeCases = list.filter((c) => c.status === "ACTIVE").length;
  const allLogs = logs ?? [];
  const logsToReview = allLogs.filter((l) => !l.reviewedAt).length;
  const logsPreview = allLogs.slice(0, 3); // pending-first from the API

  // "This month" activity, derived from real timestamps on cases and logs.
  const newThisMonth = list.filter((c) => inThisMonth(c.createdAt)).length;
  const activatedThisMonth = list.filter((c) =>
    inThisMonth(c.activatedAt),
  ).length;
  const reviewedThisMonth = allLogs.filter((l) =>
    inThisMonth(l.reviewedAt),
  ).length;
  const logsThisMonth = allLogs.filter((l) =>
    inThisMonth(l.submittedAt),
  ).length;

  const attention = list.filter((c) => caseAction(c.status) !== "NONE");
  const attentionIds = new Set(attention.map((c) => c.id));
  const recent = list
    .filter((c) => !attentionIds.has(c.id) && c.status !== "CANCELLED")
    .slice(0, 4);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Fixed header — content scrolls beneath it */}
      <View className="px-5 pb-3 bg-background" style={{ paddingTop: top + 12 }}>
        {/* Brand + actions */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Image
              source={require("@/assets/images/logo-blue2.png")}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
            {/* <Text className="text-brand font-bold" style={{ fontSize: 18 }}>
              Supracarer
            </Text> */}
          </View>
          <View className="flex-row items-center gap-3">
            <NotificationBell />
            <Pressable
              onPress={() => router.push("/(coordinator-tabs)/profile" as any)}
              hitSlop={8}
            >
              <Avatar
                name={fullName || firstName}
                initials={initials}
                photoUrl={profile?.photoUrl ?? null}
                size={38}
                bg="#0d9488"
              />
            </Pressable>
          </View>
        </View>

        {/* Greeting */}
        <View style={{ marginTop: 14 }}>
          <Text className="text-muted" style={{ fontSize: 13 }}>
            {getGreeting()},
          </Text>
          <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
            {firstName}
          </Text>
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
              border="#fde68a"
              monthValue={newThisMonth}
              monthLabel="new this month"
              onPress={() => router.push("/(coordinator-tabs)/cases" as any)}
            />
            <StatTile
              value={needsActivation}
              label="To activate"
              icon="pulse-outline"
              tint="#1d4ed8"
              bg="#eff6ff"
              border="#bfdbfe"
              monthValue={activatedThisMonth}
              monthLabel="activated this month"
              onPress={() => router.push("/(coordinator-tabs)/cases" as any)}
            />
            <StatTile
              value={logsToReview}
              label="Logs to review"
              icon="clipboard-outline"
              tint="#7c3aed"
              bg="#f5f3ff"
              border="#ddd6fe"
              monthValue={reviewedThisMonth}
              monthLabel="reviewed this month"
              onPress={() => router.push("/(coordinator-tabs)/logs" as any)}
            />
            <StatTile
              value={activeCases}
              label="Active care"
              icon="heart-outline"
              tint="#15803d"
              bg="#f0fdf4"
              border="#bbf7d0"
              monthValue={logsThisMonth}
              monthLabel="logs this month"
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
