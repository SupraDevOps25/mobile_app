import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ConfirmedHeader } from "@/components/payment/ConfirmedHeader";
import { ShareBookingCard } from "@/components/payment/ShareBookingCard";
import { VisitSummaryCard } from "@/components/payment/VisitSummaryCard";
import { useCaregiver } from "@/hooks/useCaregiver";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

function parseDurationHours(d: string): number {
  const match = d.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function formatDurationLabel(d: string): string {
  const hours = parseDurationHours(d);
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();

  const { caregiverId, date, time, duration, address, bookingRef } =
    useLocalSearchParams<{
      caregiverId: string;
      date: string;
      time: string;
      duration: string;
      address: string;
      bookingRef: string;
    }>();

  const { data: caregiver, isLoading } = useCaregiver(caregiverId);

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
        <Text className="text-muted">Booking details not available.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 48, paddingBottom: 24, gap: 16 }}
      >
        <ConfirmedHeader bookingRef={bookingRef ?? "#SC-00000"} />

        <VisitSummaryCard
          caregiver={caregiver}
          dateLabel={date ? formatDate(date) : ""}
          timeLabel={time ?? ""}
          durationLabel={formatDurationLabel(duration ?? "1 hr")}
          address={address ?? ""}
          service={caregiver.services[0]}
        />

        <ShareBookingCard />
      </ScrollView>

      {/* Action buttons */}
      <View
        className="px-5 pt-4 gap-3 bg-white"
        style={{
          paddingBottom: bottom + 12,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={() => Alert.alert("Coming soon", "Visit tracking coming soon.")}
          style={{
            backgroundColor: "#1e3a8a",
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name="location-outline" size={18} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            Track visit
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.replace("/(tabs)" as any)
          }
          style={{
            backgroundColor: "#1e3a8a",
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: 0.75,
          }}
        >
          <Ionicons name="home-outline" size={18} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            Back to home
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
