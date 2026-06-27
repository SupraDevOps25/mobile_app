import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActiveCarePlanCard } from "@/components/home/ActiveCarePlanCard";
import { CTABanner } from "@/components/home/CTABanner";
import { SectionHeader } from "@/components/home/SectionHeader";
import { PackageCard } from "@/components/packages/PackageCard";
import { toPackageView } from "@/constants/package-presentation";
import { usePackages } from "@/hooks/usePackages";
import { useActiveSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

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

  const { data: subscription } = useActiveSubscription();
  const { data: packages, isLoading: packagesLoading } = usePackages();
  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 mb-5">
        <Image
          source={require("@/assets/images/logo-blue2.png")}
          style={{ width: 42, height: 42 }}
          resizeMode="contain"
        />
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => Alert.alert("Notifications", "No new notifications.")}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={24} color="#374151" />
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
          (packages ?? []).map((pkg) => {
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
    </ScrollView>
  );
}
