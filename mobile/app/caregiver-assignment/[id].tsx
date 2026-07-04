import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaregiverAssignments } from "@/hooks/useVisits";
import { avatarColor } from "@/lib/avatar";
import type {
  ApiAssignmentVisit,
  ApiCaregiverAssignment,
} from "@/services/visit.service";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const KIND_LABEL: Record<ApiAssignmentVisit["kind"], string> = {
  INITIAL_ASSESSMENT: "Initial assessment",
  CARE_VISIT: "Care visit",
};

const ROLE_LABEL: Record<ApiCaregiverAssignment["role"], string> = {
  PRIMARY: "Lead nurse",
  BACKUP_1: "Backup nurse",
  BACKUP_2: "Backup nurse",
};

type Category = "pending" | "submitted" | "reviewed" | "missed";

function categoryOf(v: ApiAssignmentVisit): Category {
  if (v.logReviewed) return "reviewed";
  if (v.hasLog) return "submitted";
  if (v.status === "MISSED") return "missed";
  return "pending";
}

function visitBadge(v: ApiAssignmentVisit): { label: string; color: string; bg: string } {
  const cat = categoryOf(v);
  if (cat === "reviewed") return { label: "Reviewed", color: "#15803d", bg: "#f0fdf4" };
  if (cat === "submitted")
    return v.changesRequested
      ? { label: "Changes requested", color: "#dc2626", bg: "#fef2f2" }
      : { label: "Submitted", color: "#b45309", bg: "#fffbeb" };
  if (cat === "missed") return { label: "Missed", color: "#dc2626", bg: "#fef2f2" };
  return v.status === "IN_PROGRESS"
    ? { label: "In progress", color: "#1d4ed8", bg: "#eff6ff" }
    : { label: "Not started", color: "#6b7280", bg: "#f3f4f6" };
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 20, marginBottom: 10 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function VisitCard({
  v,
  onPress,
}: {
  v: ApiAssignmentVisit;
  onPress: (v: ApiAssignmentVisit) => void;
}) {
  const date = new Date(v.scheduledFor);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const badge = visitBadge(v);
  return (
    <Pressable
      onPress={() => onPress(v)}
      className="flex-row items-center bg-card rounded-2xl px-3 mb-3"
      style={{ height: 76, borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View
        className="rounded-xl items-center justify-center"
        style={{ width: 46, height: 46, backgroundColor: "#f3f4f6" }}
      >
        <Text style={{ color: "#374151", fontSize: 16, fontWeight: "700" }}>
          {date.getDate()}
        </Text>
        <Text style={{ color: "#6b7280", fontSize: 9, fontWeight: "600" }}>
          {MONTHS[date.getMonth()]}
        </Text>
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-semibold" style={{ fontSize: 14 }} numberOfLines={1}>
          {KIND_LABEL[v.kind]}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
          {time} · {v.durationHrs} hrs
        </Text>
      </View>
      <View className="rounded-full px-2.5 py-1 mr-1" style={{ backgroundColor: badge.bg }}>
        <Text style={{ color: badge.color, fontSize: 10, fontWeight: "700" }}>
          {badge.label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#c4c9d1" />
    </Pressable>
  );
}

// A visit group whose list scrolls inside a capped height, so a long run of
// visits (e.g. 26 pending) stays compact instead of stretching the page.
function VisitGroup({
  title,
  visits,
  onPress,
}: {
  title: string;
  visits: ApiAssignmentVisit[];
  onPress: (v: ApiAssignmentVisit) => void;
}) {
  if (visits.length === 0) return null;
  // Card is 76 tall + 12 margin ≈ 88; cap at ~4 cards, then scroll inside.
  const capped = visits.length > 4;
  return (
    <>
      <SectionLabel title={title} />
      <ScrollView
        style={capped ? { maxHeight: 352 } : undefined}
        scrollEnabled={capped}
        nestedScrollEnabled
        showsVerticalScrollIndicator={capped}
        contentContainerStyle={{ paddingBottom: 2 }}
      >
        {visits.map((v) => (
          <VisitCard key={v.id} v={v} onPress={onPress} />
        ))}
      </ScrollView>
    </>
  );
}

export default function CaregiverAssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data: assignments, isLoading } = useCaregiverAssignments();
  const item = assignments?.find((a) => a.assignmentId === id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }
  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Assignment not found.</Text>
      </View>
    );
  }

  const c = item.client;
  const pending = item.visits.filter((v) => categoryOf(v) === "pending");
  const submitted = item.visits.filter((v) => categoryOf(v) === "submitted");
  const reviewed = item.visits.filter((v) => categoryOf(v) === "reviewed");
  const missed = item.visits.filter((v) => categoryOf(v) === "missed");

  function openVisit(v: ApiAssignmentVisit) {
    const cat = categoryOf(v);
    if (cat === "pending") {
      router.push({
        pathname: "/(caregiver-tabs)/active-visit" as any,
        params: { id: v.id },
      });
    } else {
      router.push({ pathname: "/caregiver-visit/[id]" as any, params: { id: v.id } });
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Assignment
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 24 }}
      >
        {/* Case banner */}
        <View className="rounded-2xl p-4" style={{ backgroundColor: "#0f2461" }}>
          <View className="flex-row items-center">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor(c.name) }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                {c.initials}
              </Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                {c.name}
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                {c.age} yrs · {c.gender === "MALE" ? "Male" : "Female"} · {ROLE_LABEL[item.role]}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center mt-3" style={{ gap: 14 }}>
            <View className="flex-row items-center">
              <Ionicons name="cube-outline" size={14} color="#94a3b8" />
              <Text style={{ color: "#cbd5e1", fontSize: 12, marginLeft: 5 }}>
                {item.packageName ?? item.packageType}
              </Text>
            </View>
            {item.coordinatorName && (
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={14} color="#94a3b8" />
                <Text style={{ color: "#cbd5e1", fontSize: 12, marginLeft: 5 }}>
                  {item.coordinatorName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Location */}
        <View className="flex-row items-center mt-4">
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text className="text-foreground" style={{ fontSize: 14, marginLeft: 6, flex: 1 }}>
            {[c.address, c.area, c.city].filter(Boolean).join(", ")}
          </Text>
        </View>

        {/* Conditions */}
        {c.conditions.length > 0 && (
          <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
            {c.conditions.map((cond) => (
              <View key={cond} className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#f3f4f6" }}>
                <Text style={{ color: "#374151", fontSize: 12, fontWeight: "500" }}>{cond}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Visits, grouped by state */}
        {item.visits.length === 0 ? (
          <View className="items-center" style={{ marginTop: 40 }}>
            <Ionicons name="calendar-outline" size={26} color="#9ca3af" />
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 8 }}>
              No visits have been scheduled for this case yet.
            </Text>
          </View>
        ) : (
          <>
            <VisitGroup
              title={`Pending · ${pending.length}`}
              visits={pending}
              onPress={openVisit}
            />
            <VisitGroup
              title={`Submitted · ${submitted.length}`}
              visits={submitted}
              onPress={openVisit}
            />
            <VisitGroup
              title={`Reviewed · ${reviewed.length}`}
              visits={reviewed}
              onPress={openVisit}
            />
            <VisitGroup
              title={`Missed · ${missed.length}`}
              visits={missed}
              onPress={openVisit}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
