import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaregiverCard } from "@/components/home/CaregiverCard";
import { CTABanner } from "@/components/home/CTABanner";
import { SearchBar } from "@/components/home/SearchBar";
import { SectionHeader } from "@/components/home/SectionHeader";
import { ServiceCard } from "@/components/home/ServiceCard";
import { NEARBY_CAREGIVERS, SERVICES, type Caregiver } from "@/constants/mock-data";
import { useAuth } from "@/hooks/useAuth";
import { caregiverService, type CaregiverSummary } from "@/services/caregiver.service";

function summaryToCaregiver(s: CaregiverSummary): Caregiver {
  return {
    id: s.profileId, // profileId becomes the route id for real caregivers
    name: s.name,
    role: s.role,
    yearsExp: s.yearsExp,
    rating: s.rating,
    availability: s.availability,
    initials: s.initials,
    avatarColor: s.avatarColor,
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: apiCaregivers } = useQuery({
    queryKey: ["caregivers"],
    queryFn: caregiverService.listAll,
    retry: false, // fall back to mock on any error
  });

  // Use real caregivers when available; fall back to mock while loading or if empty
  const caregivers: Caregiver[] =
    apiCaregivers && apiCaregivers.length > 0
      ? apiCaregivers.map(summaryToCaregiver)
      : NEARBY_CAREGIVERS;

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
          What care do you need today?
        </Text>
      </View>

      {/* Search */}
      <View className="px-5 mb-6">
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {/* Services */}
      <View className="px-5 mb-6">
        <SectionHeader
          title="Our services"
          onSeeAll={() => Alert.alert("Coming soon")}
        />
        <View style={{ gap: 12 }}>
          <View className="flex-row" style={{ gap: 12 }}>
            <ServiceCard service={SERVICES[0]} />
            <ServiceCard service={SERVICES[1]} />
          </View>
          <View className="flex-row" style={{ gap: 12 }}>
            <ServiceCard service={SERVICES[2]} />
            <ServiceCard service={SERVICES[3]} />
          </View>
        </View>
      </View>

      {/* CTA Banner */}
      <View className="px-5 mb-6">
        <CTABanner />
      </View>

      {/* Available Near You */}
      <View className="px-5">
        <SectionHeader
          title="Available near you"
          onSeeAll={() => Alert.alert("Coming soon")}
        />
        {caregivers.map((caregiver) => (
          <CaregiverCard key={caregiver.id} caregiver={caregiver} />
        ))}
      </View>
    </ScrollView>
  );
}
