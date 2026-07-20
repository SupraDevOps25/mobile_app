import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationBell } from "@/components/NotificationBell";
import { ActiveCarePlanCard } from "@/components/home/ActiveCarePlanCard";
import { CTABanner } from "@/components/home/CTABanner";
import { FamilyStatsRow } from "@/components/home/FamilyStatsRow";
import { PendingInvoiceBanner } from "@/components/home/PendingInvoiceBanner";
import { SectionHeader } from "@/components/home/SectionHeader";
import { PastCareCard } from "@/components/care-plan/PastCareCard";
import { PackageCard } from "@/components/packages/PackageCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { toPackageView } from "@/constants/package-presentation";
import { usePackages } from "@/hooks/usePackages";
import {
  useActiveSubscription,
  useSubscriptionHistory,
} from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useFamilyProfile, useFamilyStats } from "@/hooks/useFamily";
import { useRefresh } from "@/hooks/useRefresh";

// How many packages to preview on the home screen (full list is on /packages).
const HOME_PACKAGE_LIMIT = 2;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const { data: subscription, refetch: refetchSub } = useActiveSubscription();
  const { data: packages, isLoading: packagesLoading, refetch: refetchPackages } =
    usePackages();
  const { data: pastCare, refetch: refetchPast } = useSubscriptionHistory();
  const { data: familyProfile, refetch: refetchProfile } = useFamilyProfile();
  const { data: stats, refetch: refetchStats } = useFamilyStats();
  const { refreshing, onRefresh } = useRefresh([
    refetchSub,
    refetchPackages,
    refetchPast,
    refetchProfile,
    refetchStats,
  ]);
  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";
  const initials = firstName.slice(0, 2).toUpperCase();
  const photoUrl = familyProfile?.photoUrl ?? null;

  // Dashboard quick search — filter care packages by name, tagline or fit.
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const packageViews = (packages ?? []).map(toPackageView);
  const filteredPackages = searching
    ? packageViews.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.tagline.toLowerCase().includes(q) ||
          v.idealFor.toLowerCase().includes(q),
      )
    : [];

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Fixed header — content scrolls beneath it */}
      <View
        className="flex-row items-center justify-between px-5 pb-3 bg-background"
        style={{ paddingTop: top + 12 }}
      >
        <Image
          source={require("@/assets/images/logo-blue2.png")}
          style={{ width: 42, height: 42 }}
          resizeMode="contain"
        />
        <View className="flex-row items-center gap-3">
          <NotificationBell />
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1e3a8a"
            colors={["#1e3a8a"]}
          />
        }
      >
      {/* Greeting */}
      <View className="px-5 mb-5">
        <Text className="text-foreground font-bold" style={{ fontSize: 24 }}>
          {getGreeting()}, {firstName}
        </Text>
        <Text className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>
          {subscription
            ? "Here's your care at a glance."
            : "Personalized homecare for your loved ones."}
        </Text>
      </View>

       {/* Quick search */}
      <View className="px-5 mb-5">
        <SearchInput
          value={query}
          onChangeText={setQuery}
          accent="#1e3a8a"
          placeholder="Search care packages"
        />
      </View>

      {/* At-a-glance stats — painted from cache the moment the dashboard loads */}
      <View className="px-5 mb-3">
        <FamilyStatsRow stats={stats} />
      </View>

      {/* Invoice due — appears when the coordinator issues this month's invoice */}
      <View className="px-5 mb-2">
        <PendingInvoiceBanner />
      </View>

     

      {searching ? (
        /* Search results — matching care packages */
        <View className="px-5">
          {filteredPackages.length === 0 ? (
            <View className="items-center" style={{ paddingVertical: 36 }}>
              <Ionicons name="search-outline" size={28} color="#9ca3af" />
              <Text className="text-muted text-center" style={{ fontSize: 14, marginTop: 10 }}>
                No care packages match “{query.trim()}”.
              </Text>
            </View>
          ) : (
            filteredPackages.map((view) => (
              <PackageCard
                key={view.type}
                pkg={view}
                onPress={(p) => router.push(`/packages/${p.type}` as any)}
              />
            ))
          )}
        </View>
      ) : (
        <>
          {/* Active plan summary, or the get-started CTA */}
          <View className="px-5 mb-6">
            {subscription ? (
              <ActiveCarePlanCard subscription={subscription} />
            ) : (
              <CTABanner />
            )}
          </View>

          {/* Packages */}
          <View className="px-5">
            <SectionHeader
              title="Our care packages"
              onSeeAll={() => router.push("/packages" as any)}
            />
            {packagesLoading ? (
              <ActivityIndicator color="#1e3a8a" style={{ marginVertical: 24 }} />
            ) : (
              (packages ?? []).slice(0, HOME_PACKAGE_LIMIT).map((pkg) => {
                const view = toPackageView(pkg);
                return (
                  <PackageCard
                    key={view.type}
                    pkg={view}
                    onPress={(p) => router.push(`/packages/${p.type}` as any)}
                  />
                );
              })
            )}
          </View>

          {/* Previous care received — a record of past engagements */}
          {(pastCare ?? []).length > 0 && (
            <View className="px-5 mt-6">
              <SectionHeader
                title="Previous care"
                onSeeAll={() => router.push("/(tabs)/bookings" as any)}
              />
              {(pastCare ?? []).slice(0, 2).map((item) => (
                <PastCareCard
                  key={item.id}
                  item={item}
                  onPress={(p) => router.push(`/past-care/${p.id}` as any)}
                />
              ))}
            </View>
          )}

          {/* How it works */}
          <View className="px-5 mt-2">
            <View
              className="flex-row rounded-2xl p-4"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#2563eb" />
              <Text
                style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
              >
                You choose a package — Supracarer assigns and coordinates a dedicated
                care team, including a Care Coordinator and backup nurses.
              </Text>
            </View>
          </View>
        </>
      )}
      </ScrollView>
    </View>
  );
}
