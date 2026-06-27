import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssignmentOfferCard } from "@/components/caregiver-home/AssignmentOfferCard";
import { GreetingCard } from "@/components/caregiver-home/GreetingCard";
import { StatCard } from "@/components/caregiver-home/StatCard";
import { UpcomingVisitRow } from "@/components/caregiver-home/UpcomingVisitRow";
import { CAREGIVER_STATS } from "@/constants/caregiver-dashboard";
import { useOffers } from "@/hooks/useAssignments";
import {
  useCaregiverProfile,
  useSetAvailability,
} from "@/hooks/useCaregiverProfile";
import { useUpcomingVisits } from "@/hooks/useVisits";
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

  const { data: offers, isLoading: offersLoading } = useOffers();
  const { data: upcoming, isLoading: visitsLoading } = useUpcomingVisits();
  const { data: profile } = useCaregiverProfile();
  const setAvailability = useSetAvailability();
  const offerCount = offers?.length ?? 0;
  const available = profile?.isAvailable ?? false;

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
            {offerCount > 0 && (
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
          offerCount={offerCount}
        />
      </View>

      {/* Availability quick toggle */}
      <View className="px-5 mb-4">
        <Pressable
          onPress={() => router.push("/(caregiver-tabs)/availability" as any)}
          className="flex-row items-center rounded-2xl p-4"
          style={{
            borderWidth: 1,
            borderColor: available ? "#bbf7d0" : "#e5e7eb",
            backgroundColor: available ? "#f0fdf4" : "#f9fafb",
          }}
        >
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: available ? "#dcfce7" : "#e5e7eb" }}
          >
            <Ionicons
              name={available ? "checkmark-circle" : "pause-circle"}
              size={18}
              color={available ? "#16a34a" : "#6b7280"}
            />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
              {available ? "Available for cases" : "Not available"}
            </Text>
            <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
              {available
                ? "You can be matched to new cases"
                : "Turn on to receive new offers"}
            </Text>
          </View>
          <Switch
            value={available}
            onValueChange={(next) =>
              setAvailability.mutate(next, {
                onError: (err: Error) =>
                  Alert.alert("Couldn't update", err.message),
              })
            }
            disabled={setAvailability.isPending || !profile}
            trackColor={{ false: "#d1d5db", true: "#16a34a" }}
            thumbColor="#ffffff"
          />
        </Pressable>
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

      {/* Assignment offers */}
      <View className="px-5 mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground text-lg font-bold">Assignment offers</Text>
        </View>
        {offersLoading ? (
          <ActivityIndicator color="#16a34a" style={{ marginVertical: 16 }} />
        ) : offerCount === 0 ? (
          <View
            className="rounded-2xl p-4 items-center"
            style={{ backgroundColor: "#f9fafb" }}
          >
            <Ionicons name="checkmark-done-outline" size={22} color="#9ca3af" />
            <Text className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
              No new offers right now.
            </Text>
          </View>
        ) : (
          (offers ?? []).map((assignment) => (
            <AssignmentOfferCard
              key={assignment.id}
              assignment={assignment}
              onPress={(a) => router.push(`/assignment/${a.id}` as any)}
            />
          ))
        )}
      </View>

      {/* Upcoming visits */}
      <View className="px-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground text-lg font-bold">
            Upcoming visits
          </Text>
        </View>
        {visitsLoading ? (
          <ActivityIndicator color="#16a34a" style={{ marginVertical: 16 }} />
        ) : (upcoming ?? []).length === 0 ? (
          <View
            className="rounded-2xl p-4 items-center"
            style={{ backgroundColor: "#f9fafb" }}
          >
            <Ionicons name="calendar-outline" size={22} color="#9ca3af" />
            <Text className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
              No upcoming visits scheduled.
            </Text>
          </View>
        ) : (
          (upcoming ?? []).map((visit) => (
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
      </View>
    </ScrollView>
  );
}
