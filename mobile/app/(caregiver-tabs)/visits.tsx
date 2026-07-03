import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UpcomingVisitRow } from "@/components/caregiver-home/UpcomingVisitRow";
import { useUpcomingVisits, useVisitHistory } from "@/hooks/useVisits";
import type { ApiVisitHistoryRow } from "@/services/visit.service";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

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

function statusBadge(v: ApiVisitHistoryRow): { label: string; color: string; bg: string } {
  if (v.status === "MISSED") return { label: "Missed", color: "#dc2626", bg: "#fef2f2" };
  if (v.changesRequested) return { label: "Changes requested", color: "#dc2626", bg: "#fef2f2" };
  if (v.hasLog && v.logReviewed) return { label: "Reviewed", color: "#15803d", bg: "#f0fdf4" };
  if (v.hasLog) return { label: "Submitted", color: "#d97706", bg: "#fffbeb" };
  return { label: "No log", color: "#6b7280", bg: "#f3f4f6" };
}

function PastVisitRow({
  visit,
  onPress,
}: {
  visit: ApiVisitHistoryRow;
  onPress: (v: ApiVisitHistoryRow) => void;
}) {
  const date = new Date(visit.scheduledFor);
  const badge = statusBadge(visit);
  return (
    <Pressable
      onPress={() => onPress(visit)}
      className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View
        className="rounded-xl items-center justify-center"
        style={{ width: 48, height: 48, backgroundColor: "#f3f4f6" }}
      >
        <Text style={{ color: "#374151", fontSize: 16, fontWeight: "700" }}>
          {date.getDate()}
        </Text>
        <Text style={{ color: "#6b7280", fontSize: 9, fontWeight: "600" }}>
          {MONTHS[date.getMonth()]}
        </Text>
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 14 }}>
          {visit.clientName}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
          {visit.area} · {visit.durationHrs}hrs
        </Text>
      </View>
      <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: badge.bg }}>
        <Text style={{ color: badge.color, fontSize: 10, fontWeight: "700" }}>
          {badge.label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function VisitsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingVisits();
  const { data: past, isLoading: pastLoading } = useVisitHistory();

  const upcomingList = upcoming ?? [];
  const pastList = past ?? [];
  const nothing =
    !upcomingLoading &&
    !pastLoading &&
    upcomingList.length === 0 &&
    pastList.length === 0;

  return (
    <View className="flex-1 bg-background">
      {/* Fixed header */}
      <View className="px-5 pb-2 bg-background" style={{ paddingTop: top + 24 }}>
        <Text className="text-foreground text-2xl font-bold mb-1">Visits</Text>
        <Text className="text-muted text-sm">
          Your current and past assigned visits.
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {upcomingLoading || pastLoading ? (
          <ActivityIndicator color="#16a34a" style={{ marginVertical: 24 }} />
        ) : nothing ? (
          <View className="items-center" style={{ marginTop: 48 }}>
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <Ionicons name="calendar-outline" size={28} color="#16a34a" />
            </View>
            <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
              No visits yet
            </Text>
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4 }}>
              Visits appear here once a case you accepted is activated.
            </Text>
          </View>
        ) : (
          <>
            {upcomingList.length > 0 && (
              <>
                <SectionLabel title={`Upcoming · ${upcomingList.length}`} />
                {upcomingList.map((visit) => (
                  <UpcomingVisitRow
                    key={visit.id}
                    visit={visit}
                    onPress={(v) =>
                      router.push({
                        pathname: "/(caregiver-tabs)/active-visit" as any,
                        params: { id: v.id },
                      })
                    }
                  />
                ))}
              </>
            )}

            {pastList.length > 0 && (
              <>
                <SectionLabel title={`Past visits · ${pastList.length}`} />
                {pastList.map((visit) => (
                  <PastVisitRow
                    key={visit.id}
                    visit={visit}
                    onPress={(v) =>
                      router.push({
                        pathname: "/caregiver-visit/[id]" as any,
                        params: { id: v.id },
                      })
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
