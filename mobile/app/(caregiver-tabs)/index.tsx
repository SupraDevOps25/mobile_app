import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GreetingCard } from "@/components/caregiver-home/GreetingCard";
import { StatCard } from "@/components/caregiver-home/StatCard";
import { UpcomingVisitRow } from "@/components/caregiver-home/UpcomingVisitRow";
import { VisitRequestCard } from "@/components/caregiver-home/VisitRequestCard";
import {
  CAREGIVER_STATS,
  NEW_VISIT_REQUESTS,
  UPCOMING_VISITS,
} from "@/constants/caregiver-dashboard";
import { useAuth } from "@/hooks/useAuth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CaregiverHomeScreen() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";
  const initials = firstName.slice(0, 2).toUpperCase();
  const stats = CAREGIVER_STATS;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 mb-4">
        <View className="flex-row items-center gap-2">
          <Image
            source={require("@/assets/images/logo-blue2.png")}
            style={{ width: 36, height: 36 }}
            resizeMode="contain"
          />
          <Text className="text-brand font-bold" style={{ fontSize: 18 }}>
            Supracarer
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => Alert.alert("Notifications", "No new notifications.")}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            {NEW_VISIT_REQUESTS.length > 0 && (
              <View
                className="absolute rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "#dc2626",
                  top: 0,
                  right: 1,
                }}
              />
            )}
          </Pressable>
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 13 }}>
              {initials}
            </Text>
          </View>
        </View>
      </View>

      {/* Greeting card */}
      <View className="px-5 mb-4">
        <GreetingCard
          greeting={getGreeting()}
          firstName={firstName}
          initials={initials}
          dateLabel={getDateLabel()}
          newRequestCount={NEW_VISIT_REQUESTS.length}
        />
      </View>

      {/* Stats */}
      <View className="flex-row px-5 mb-6" style={{ gap: 10 }}>
        <StatCard
          value={String(stats.visitsThisWeek)}
          label="Visits this week"
          trend={`↑ ${stats.visitsDelta} vs last`}
        />
        <StatCard
          value={stats.rating.toFixed(1)}
          label="Your rating"
          trend="★ Top rated"
          trendColor="#f59e0b"
        />
        <StatCard
          value={`₵${stats.earnedThisWeekGhs}`}
          label="Earned this week"
          trend={`↑ ₵${stats.earnedDeltaGhs}`}
        />
      </View>

      {/* New requests */}
      <View className="px-5 mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground text-lg font-bold">New requests</Text>
          <Pressable onPress={() => Alert.alert("Coming soon")} hitSlop={8}>
            <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "600" }}>
              See all
            </Text>
          </Pressable>
        </View>
        {NEW_VISIT_REQUESTS.map((request) => (
          <VisitRequestCard
            key={request.id}
            request={request}
            onPress={(r) => router.push(`/visit-request/${r.id}` as any)}
            onDecline={(r) =>
              Alert.alert(
                "Decline visit",
                `Decline the visit for ${r.familyName}? It will be offered to another caregiver.`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Decline", style: "destructive" },
                ],
              )
            }
          />
        ))}
      </View>

      {/* Upcoming visits */}
      <View className="px-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground text-lg font-bold">
            Upcoming visits
          </Text>
          <Pressable onPress={() => Alert.alert("Coming soon")} hitSlop={8}>
            <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "600" }}>
              Schedule
            </Text>
          </Pressable>
        </View>
        {UPCOMING_VISITS.map((visit) => (
          <UpcomingVisitRow
            key={visit.id}
            visit={visit}
            onPress={(v) =>
              Alert.alert(
                "Start visit",
                `Start your visit with ${v.familyName} now?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Start visit",
                    onPress: () =>
                      router.push({
                        pathname: "/(caregiver-tabs)/active-visit" as any,
                        params: { id: v.id },
                      }),
                  },
                ],
              )
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}
