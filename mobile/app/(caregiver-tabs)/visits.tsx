import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { useCaregiverAssignments } from "@/hooks/useVisits";
import type { ApiCaregiverAssignment } from "@/services/visit.service";
import type { ApiSubscriptionStatus } from "@/services/subscription.service";

const STATUS_LABEL: Record<ApiSubscriptionStatus, string> = {
  MATCHING: "Matching",
  TEAM_ASSIGNED: "Getting started",
  AWAITING_ACTIVATION: "Awaiting activation",
  ACTIVE: "Active care",
  RENEWING: "Renewing",
  PAUSED: "Paused",
  CANCELLED: "Ended",
};

const ROLE_LABEL: Record<ApiCaregiverAssignment["role"], string> = {
  PRIMARY: "Lead nurse",
  BACKUP_1: "Backup nurse",
  BACKUP_2: "Backup nurse",
};

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 18, marginBottom: 10 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function CountPill({ n, label, color, bg }: { n: number; label: string; color: string; bg: string }) {
  if (n === 0) return null;
  return (
    <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: bg }}>
      <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{n}</Text>
      <Text style={{ color, fontSize: 11, marginLeft: 3 }}>{label}</Text>
    </View>
  );
}

function AssignmentCard({
  item,
  onPress,
}: {
  item: ApiCaregiverAssignment;
  onPress: (a: ApiCaregiverAssignment) => void;
}) {
  const when = item.active
    ? item.nextVisitAt
      ? `Next visit ${new Date(item.nextVisitAt).toLocaleDateString([], { day: "numeric", month: "short" })}`
      : "No upcoming visits"
    : item.lastVisitAt
      ? `Last visit ${new Date(item.lastVisitAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}`
      : "No visits recorded";

  const done = item.counts.reviewed + item.counts.submitted;
  const pct =
    item.counts.total > 0 ? Math.round((done / item.counts.total) * 100) : 0;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => ({
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#ebedf0",
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
        shadowColor: "#0f172a",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      })}
    >
      <View className="flex-row items-center">
        <Avatar
          name={item.client.name}
          initials={item.client.initials}
          photoUrl={item.client.photoUrl}
          size={48}
        />
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 15.5 }}>
            {item.client.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {item.packageName ?? "Care package"} · {ROLE_LABEL[item.role]}
          </Text>
        </View>
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: item.active ? "#f0fdf4" : "#f3f4f6" }}
        >
          <Text
            style={{ color: item.active ? "#15803d" : "#6b7280", fontSize: 10, fontWeight: "700" }}
          >
            {STATUS_LABEL[item.subscriptionStatus]}
          </Text>
        </View>
      </View>

      {/* Progress toward completing the month's visits */}
      {item.counts.total > 0 && (
        <View style={{ marginTop: 14 }}>
          <View className="flex-row items-center justify-between" style={{ marginBottom: 6 }}>
            <Text className="text-muted" style={{ fontSize: 11.5 }}>
              {done} of {item.counts.total} visits logged
            </Text>
            <Text style={{ color: "#16a34a", fontSize: 11.5, fontWeight: "700" }}>
              {pct}%
            </Text>
          </View>
          <View
            style={{ height: 6, borderRadius: 3, backgroundColor: "#f1f5f9", overflow: "hidden" }}
          >
            <View
              style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: "#16a34a" }}
            />
          </View>
        </View>
      )}

      {/* Visit breakdown */}
      <View className="flex-row flex-wrap items-center mt-3" style={{ gap: 6 }}>
        <CountPill n={item.counts.pending} label="pending" color="#1d4ed8" bg="#eff6ff" />
        <CountPill n={item.counts.submitted} label="submitted" color="#b45309" bg="#fffbeb" />
        <CountPill n={item.counts.reviewed} label="reviewed" color="#15803d" bg="#f0fdf4" />
        <CountPill n={item.counts.missed} label="missed" color="#dc2626" bg="#fef2f2" />
        {item.counts.total === 0 && (
          <Text className="text-muted" style={{ fontSize: 12 }}>
            No visits scheduled yet
          </Text>
        )}
      </View>

      <View
        className="flex-row items-center justify-between mt-3 pt-3"
        style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
      >
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
          <Text className="text-muted" style={{ fontSize: 12, marginLeft: 5 }}>
            {when}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "600" }}>
            View
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#16a34a" />
        </View>
      </View>
    </Pressable>
  );
}

export default function VisitsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: assignments, isLoading } = useCaregiverAssignments();

  const list = assignments ?? [];
  const active = list.filter((a) => a.active);
  const previous = list.filter((a) => !a.active);

  function open(a: ApiCaregiverAssignment) {
    router.push({
      pathname: "/caregiver-assignment/[id]" as any,
      params: { id: a.assignmentId },
    });
  }

  return (
    <View className="flex-1 bg-background">
      {/* Fixed header */}
      <View className="px-5 pb-2 bg-background" style={{ paddingTop: top + 24 }}>
        <Text className="text-foreground text-2xl font-bold mb-1">Visits</Text>
        <Text className="text-muted text-sm">
          The cases you&apos;re assigned to.
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color="#16a34a" style={{ marginVertical: 24 }} />
        ) : list.length === 0 ? (
          <View className="items-center" style={{ marginTop: 48 }}>
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <Ionicons name="briefcase-outline" size={28} color="#16a34a" />
            </View>
            <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
              No assignments yet
            </Text>
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4 }}>
              Cases you accept appear here with their visits.
            </Text>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <SectionLabel title={`Active · ${active.length}`} />
                {active.map((a) => (
                  <AssignmentCard key={a.assignmentId} item={a} onPress={open} />
                ))}
              </>
            )}
            {previous.length > 0 && (
              <>
                <SectionLabel title={`Previous · ${previous.length}`} />
                {previous.map((a) => (
                  <AssignmentCard key={a.assignmentId} item={a} onPress={open} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
