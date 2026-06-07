import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AboutSection } from "@/components/caregiver/AboutSection";
import { BookingFooter } from "@/components/caregiver/BookingFooter";
import { CaregiverHeroSection } from "@/components/caregiver/CaregiverHeroSection";
import { ReviewsSection } from "@/components/caregiver/ReviewsSection";
import { ServicesOfferedSection } from "@/components/caregiver/ServicesOfferedSection";
import { StatBar } from "@/components/caregiver/StatBar";
import { WeeklyAvailabilitySection } from "@/components/caregiver/WeeklyAvailabilitySection";
import { useCaregiver } from "@/hooks/useCaregiver";

export default function CaregiverDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: caregiver, isLoading } = useCaregiver(id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  if (!caregiver) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Caregiver not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Custom header */}
      <View
        className="flex-row items-center justify-between px-5 pb-3"
        style={{ paddingTop: top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>

        <View className="flex-row gap-3">
          <Pressable
            hitSlop={12}
            onPress={() => Alert.alert("Coming soon", "Save to favourites coming soon.")}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <Ionicons name="heart-outline" size={20} color="#111827" />
          </Pressable>
          <Pressable
            hitSlop={12}
            onPress={() => Alert.alert("Coming soon", "Share profile coming soon.")}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <Ionicons name="share-outline" size={20} color="#111827" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
      >
        <CaregiverHeroSection caregiver={caregiver} />
        <StatBar caregiver={caregiver} />
        <AboutSection bio={caregiver.bio} />
        <ServicesOfferedSection services={caregiver.services} />
        <WeeklyAvailabilitySection availability={caregiver.weeklyAvailability} />
        <ReviewsSection reviews={caregiver.reviews} reviewCount={caregiver.reviewCount} />
      </ScrollView>

      <BookingFooter hourlyRate={caregiver.hourlyRate} caregiverId={caregiver.id} />
    </View>
  );
}
