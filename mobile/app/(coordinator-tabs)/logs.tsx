import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CoordinatorLogRow } from "@/components/coordinator/CoordinatorLogRow";
import { useCoordinatorLogs } from "@/hooks/useCoordinator";
import { useRefresh } from "@/hooks/useRefresh";
import type { ApiCoordinatorLog } from "@/services/coordinator.service";

const TEAL = "#0d9488";

type Filter = "all" | "pending" | "escalations" | "reviewed";
type Period = "all" | "today" | "week" | "month";
type Sort = "newest" | "oldest";

// Keep a log if its submission falls inside the selected date window. "week"
// and "month" are rolling (last 7 / 30 days) — the most useful "recent" lens.
function withinPeriod(iso: string, period: Period): boolean {
  if (period === "all") return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return t >= start.getTime();
  }
  const days = period === "week" ? 7 : 30;
  return t >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-full"
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: active ? TEAL : "#ffffff",
        borderWidth: 1,
        borderColor: active ? TEAL : "#e5e7eb",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: active ? "#ffffff" : "#374151",
        }}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View
          className="rounded-full items-center justify-center"
          style={{
            marginLeft: 6,
            minWidth: 20,
            paddingHorizontal: 6,
            height: 20,
            backgroundColor: active ? "rgba(255,255,255,0.25)" : "#f3f4f6",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: active ? "#ffffff" : "#6b7280",
            }}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function CoordinatorLogsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: logs, isLoading, refetch } = useCoordinatorLogs();
  const { refreshing, onRefresh } = useRefresh(refetch);

  const [filter, setFilter] = useState<Filter>("all");
  const [period, setPeriod] = useState<Period>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const all = useMemo(() => logs ?? [], [logs]);

  // Apply the date window first, so the status counts reflect what's in view.
  const periodScoped = useMemo(
    () => all.filter((l) => withinPeriod(l.submittedAt, period)),
    [all, period],
  );
  const counts = useMemo(
    () => ({
      all: periodScoped.length,
      pending: periodScoped.filter((l) => !l.reviewedAt).length,
      escalations: periodScoped.filter((l) => l.escalationNeeded).length,
      reviewed: periodScoped.filter((l) => l.reviewedAt).length,
    }),
    [periodScoped],
  );

  const visible = useMemo(() => {
    const base: ApiCoordinatorLog[] =
      filter === "pending"
        ? periodScoped.filter((l) => !l.reviewedAt)
        : filter === "reviewed"
          ? periodScoped.filter((l) => l.reviewedAt)
          : filter === "escalations"
            ? periodScoped.filter((l) => l.escalationNeeded)
            : periodScoped;
    return [...base].sort((a, b) => {
      const da = new Date(a.submittedAt).getTime();
      const db = new Date(b.submittedAt).getTime();
      return sort === "newest" ? db - da : da - db;
    });
  }, [periodScoped, filter, sort]);

  const PERIODS: { key: Period; label: string }[] = [
    { key: "all", label: "All time" },
    { key: "today", label: "Today" },
    { key: "week", label: "7 days" },
    { key: "month", label: "30 days" },
  ];

  // Only surface the Escalations filter when there are any to triage.
  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Needs review", count: counts.pending },
    ...(counts.escalations > 0
      ? [{ key: "escalations" as Filter, label: "Escalations", count: counts.escalations }]
      : []),
    { key: "reviewed", label: "Reviewed", count: counts.reviewed },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Fixed header — content scrolls beneath it */}
      <View className="px-5 pb-2 bg-background" style={{ paddingTop: top + 16 }}>
        <Text className="text-foreground text-2xl font-bold mb-1">Daily logs</Text>
        <Text className="text-muted text-sm">
          Review the visit logs your nurses submitted.
        </Text>
      </View>

      {/* Filters + sort — hidden until there's something to organise */}
      {all.length > 0 && (
        <View>
          {/* Date window */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, gap: 8 }}
          >
            {PERIODS.map((p) => (
              <FilterChip
                key={p.key}
                label={p.label}
                active={period === p.key}
                onPress={() => setPeriod(p.key)}
              />
            ))}
          </ScrollView>

          {/* Status */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
          >
            {chips.map((c) => (
              <FilterChip
                key={c.key}
                label={c.label}
                count={c.count}
                active={filter === c.key}
                onPress={() => setFilter(c.key)}
              />
            ))}
          </ScrollView>

          <View className="flex-row items-center justify-between px-5 pb-2">
            <Text className="text-muted" style={{ fontSize: 12.5 }}>
              {visible.length} {visible.length === 1 ? "log" : "logs"}
            </Text>
            <Pressable
              onPress={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
              className="flex-row items-center rounded-full"
              style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#f3f4f6" }}
              hitSlop={6}
            >
              <Ionicons name="swap-vertical" size={15} color="#374151" />
              <Text style={{ fontSize: 12.5, fontWeight: "700", color: "#374151", marginLeft: 5 }}>
                {sort === "newest" ? "Newest first" : "Oldest first"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TEAL}
            colors={[TEAL]}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={TEAL} style={{ marginVertical: 24 }} />
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
        ) : visible.length === 0 ? (
          <View className="rounded-2xl p-5 items-center" style={{ backgroundColor: "#f9fafb", marginTop: 4 }}>
            <Ionicons name="checkmark-done-outline" size={22} color="#9ca3af" />
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 6 }}>
              {filter === "pending"
                ? "All caught up — nothing to review."
                : filter === "escalations"
                  ? "No escalations flagged right now."
                  : "Nothing here yet."}
            </Text>
          </View>
        ) : (
          visible.map((log) => (
            <CoordinatorLogRow
              key={log.visitId}
              log={log}
              onPress={(l) => router.push(`/coordinator-log/${l.visitId}` as any)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
