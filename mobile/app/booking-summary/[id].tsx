import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaregiverVerifiedCard } from "@/components/booking-summary/CaregiverVerifiedCard";
import { PriceBreakdownSection } from "@/components/booking-summary/PriceBreakdownSection";
import { VisitDetailsSection } from "@/components/booking-summary/VisitDetailsSection";
import { useCaregiver } from "@/hooks/useCaregiver";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES_FULL[date.getMonth()]} ${date.getFullYear()}`;
}

function parseDurationHours(duration: string): number {
  const match = duration.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function formatDurationLabel(duration: string): string {
  const hours = parseDurationHours(duration);
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export default function BookingSummaryScreen() {
  const { id, date, time, duration } = useLocalSearchParams<{
    id: string;
    date: string;
    time: string;
    duration: string;
  }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [notes, setNotes] = useState("");

  const { data: caregiver, isLoading } = useCaregiver(id);
  const selectedDate = date ? new Date(date) : null;
  const durationHours = parseDurationHours(duration ?? "1 hr");
  const total = caregiver ? caregiver.hourlyRate * durationHours + 10 : 0;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  if (!caregiver || !selectedDate) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Booking details not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4"
        style={{ paddingTop: top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Booking summary
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Caregiver card */}
        <CaregiverVerifiedCard caregiver={caregiver} />

        {/* Visit details */}
        <VisitDetailsSection
          service={caregiver.services[0]}
          dateLabel={formatDate(selectedDate)}
          timeLabel={time ?? ""}
          durationLabel={formatDurationLabel(duration ?? "1 hr")}
          address="14 Boundary Rd, East Legon"
          notes={notes}
          onNotesChange={setNotes}
        />

        {/* Price breakdown */}
        <PriceBreakdownSection
          hourlyRate={caregiver.hourlyRate}
          durationHours={durationHours}
        />

        {/* Terms notice */}
        <Text
          className="text-muted text-center px-8"
          style={{ fontSize: 12, lineHeight: 18 }}
        >
          By confirming you agree to our{" "}
          <Text
            style={{ color: "#2563eb" }}
            onPress={() => Alert.alert("Coming soon")}
          >
            Terms of Service
          </Text>
          {" "}and{" "}
          <Text
            style={{ color: "#2563eb" }}
            onPress={() => Alert.alert("Coming soon")}
          >
            Cancellation Policy
          </Text>
          .
        </Text>
      </ScrollView>

      {/* Confirm & Pay footer */}
      <View
        className="px-5 pt-4 bg-white"
        style={{
          paddingBottom: bottom + 12,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/payment/process" as any,
              params: {
                caregiverId: id,
                date,
                time,
                duration,
                address: "14 Boundary Rd, East Legon",
                notes,
                totalAmount: String(total),
              },
            })
          }
          style={{
            backgroundColor: "#1e3a8a",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            Confirm &amp; Pay GHC {total.toFixed(2)}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
