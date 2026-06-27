import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UpcomingVisitRow } from "@/components/caregiver-home/UpcomingVisitRow";
import { useUpcomingVisits } from "@/hooks/useVisits";

export default function VisitsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: visits, isLoading } = useUpcomingVisits();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 24, paddingHorizontal: 20, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-foreground text-2xl font-bold mb-1">Visits</Text>
      <Text className="text-muted text-sm mb-5">
        Your upcoming scheduled visits.
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#16a34a" style={{ marginVertical: 24 }} />
      ) : (visits ?? []).length === 0 ? (
        <View className="items-center" style={{ marginTop: 48 }}>
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <Ionicons name="calendar-outline" size={28} color="#16a34a" />
          </View>
          <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
            No upcoming visits
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4 }}>
            Visits appear here once a case you accepted is activated.
          </Text>
        </View>
      ) : (
        (visits ?? []).map((visit) => (
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
        ))
      )}
    </ScrollView>
  );
}
