import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
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
import { NotificationBell } from "@/components/NotificationBell";
import { AssignmentOfferCard } from "@/components/caregiver-home/AssignmentOfferCard";
import { GreetingCard } from "@/components/caregiver-home/GreetingCard";
import { StatCard } from "@/components/caregiver-home/StatCard";
import { UpcomingVisitRow } from "@/components/caregiver-home/UpcomingVisitRow";
import { verificationMeta } from "@/constants/verification";
import { useOffers } from "@/hooks/useAssignments";
import {
  useCaregiverProfile,
  useSetAvailability,
} from "@/hooks/useCaregiverProfile";
import { useUpcomingVisits, useVisitHistory } from "@/hooks/useVisits";
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

  const { data: offers, isLoading: offersLoading } = useOffers();
  const { data: upcoming, isLoading: visitsLoading } = useUpcomingVisits();
  const { data: past } = useVisitHistory();
  const { data: profile } = useCaregiverProfile();
  const setAvailability = useSetAvailability();
  const offerCount = offers?.length ?? 0;
  const available = profile?.isAvailable ?? false;

  // Real dashboard figures derived from the nurse's own data.
  const upcomingList = upcoming ?? [];
  const pastList = past ?? [];
  const completedCount = pastList.filter((v) => v.status === "COMPLETED").length;
  const changesCount = pastList.filter((v) => v.changesRequested).length;
  const ratingLabel =
    profile && profile.totalReviews > 0 ? profile.rating.toFixed(1) : "—";
  const verification = profile
    ? verificationMeta(profile.verificationStatus)
    : null;
  const previewVisits = upcomingList.slice(0, 3);

  // First-run: send a brand-new caregiver (no credentials submitted yet) into
  // the onboarding wizard. The "seen" flag means we only auto-redirect once —
  // afterwards they finish from the profile tab's verification nudge.
  const redirected = useRef(false);
  useEffect(() => {
    if (!profile || redirected.current) return;
    if (profile.verificationStatus !== "UNVERIFIED") return;
    redirected.current = true;
    void (async () => {
      const seen = await AsyncStorage.getItem("cg_onboarding_seen");
      if (!seen) router.replace("/caregiver-onboarding" as any);
    })();
  }, [profile, router]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Fixed header — content scrolls beneath it */}
      <View
        className="flex-row items-center justify-between px-5 pb-3 bg-background"
        style={{ paddingTop: top + 12 }}
      >
        <View className="flex-row items-center gap-2">
          <Image
            source={require("@/assets/images/logo-blue2.png")}
            style={{ width: 36, height: 36 }}
            resizeMode="contain"
          />
         
        </View>
        <View className="flex-row items-center gap-3">
          <NotificationBell />
          {profile?.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
            />
          ) : (
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 13 }}>
                {initials}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Greeting card */}
      <View className="px-5 mb-4">
        <GreetingCard
          greeting={getGreeting()}
          firstName={firstName}
          initials={initials}
          dateLabel={getDateLabel()}
          offerCount={offerCount}
          photoUrl={profile?.photoUrl}
        />
      </View>

      {/* Verification banner — until the account is verified */}
      {verification && profile && profile.verificationStatus !== "VERIFIED" && (
        <Pressable
          onPress={() => router.push("/caregiver-credentials" as any)}
          className="mx-5 mb-4 flex-row items-center rounded-2xl p-4"
          style={{ backgroundColor: verification.bg }}
        >
          <Ionicons name={verification.icon} size={20} color={verification.color} />
          <Text
            style={{ color: verification.color, fontSize: 12.5, marginLeft: 8, flex: 1, lineHeight: 18 }}
          >
            {verification.hint}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={verification.color} />
        </Pressable>
      )}

      {/* Logs the coordinator asked to revise */}
      {changesCount > 0 && (
        <Pressable
          onPress={() => router.push("/(caregiver-tabs)/visits" as any)}
          className="mx-5 mb-4 flex-row items-center rounded-2xl p-4"
          style={{ backgroundColor: "#fef2f2" }}
        >
          <Ionicons name="alert-circle" size={20} color="#dc2626" />
          <Text
            style={{ color: "#b91c1c", fontSize: 12.5, marginLeft: 8, flex: 1, lineHeight: 18 }}
          >
            {changesCount} care {changesCount === 1 ? "log needs" : "logs need"} changes.
            Tap to revise and resubmit.
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#dc2626" />
        </Pressable>
      )}

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
          value={String(upcomingList.length)}
          label="Upcoming visits"
          trend="Scheduled"
          icon="calendar-outline"
          tint="#1d4ed8"
          bg="#eff6ff"
          border="#bfdbfe"
        />
        <StatCard
          value={String(completedCount)}
          label="Visits completed"
          trend="All time"
          icon="checkmark-done-outline"
          tint="#15803d"
          bg="#f0fdf4"
          border="#bbf7d0"
        />
        <StatCard
          value={ratingLabel}
          label="Your rating"
          trend={profile && profile.totalReviews > 0 ? `★ ${profile.totalReviews} reviews` : "No reviews yet"}
          icon="star"
          tint="#b45309"
          bg="#fffbeb"
          border="#fde68a"
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

      {/* Upcoming visits — preview of the next 3 */}
      <View className="px-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground text-lg font-bold">
            Upcoming visits
          </Text>
          {upcomingList.length > 3 && (
            <Pressable
              onPress={() => router.push("/(caregiver-tabs)/visits" as any)}
              hitSlop={8}
            >
              <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "600" }}>
                See all
              </Text>
            </Pressable>
          )}
        </View>
        {visitsLoading ? (
          <ActivityIndicator color="#16a34a" style={{ marginVertical: 16 }} />
        ) : upcomingList.length === 0 ? (
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
          <>
            {previewVisits.map((visit) => (
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
            {upcomingList.length > 3 && (
              <Pressable
                onPress={() => router.push("/(caregiver-tabs)/visits" as any)}
                className="rounded-2xl items-center justify-center py-3"
                style={{ backgroundColor: "#f0fdf4" }}
              >
                <Text style={{ color: "#15803d", fontSize: 13, fontWeight: "700" }}>
                  See all {upcomingList.length} visits
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>
      </ScrollView>
    </View>
  );
}
