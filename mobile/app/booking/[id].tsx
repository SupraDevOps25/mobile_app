import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookingSummaryFooter } from "@/components/booking/BookingSummaryFooter";
import { CaregiverMiniCard } from "@/components/booking/CaregiverMiniCard";
import { DurationPicker } from "@/components/booking/DurationPicker";
import { MonthCalendar } from "@/components/booking/MonthCalendar";
import { TimeSlotPicker, type TimeSlot } from "@/components/booking/TimeSlotPicker";
import { useCaregiver } from "@/hooks/useCaregiver";

const TIME_SLOTS: TimeSlot[] = [
  { time: "8:00 AM", available: true },
  { time: "10:00 AM", available: true },
  { time: "12:00 PM", available: false },
  { time: "2:00 PM", available: true },
  { time: "4:00 PM", available: true },
  { time: "6:00 PM", available: false },
];

const DURATIONS = ["1 hr", "2 hrs", "3 hrs", "4 hrs+"];

// Maps WeekDay short names to JS Date.getDay() values
const DAY_MAP: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0,
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: caregiver, isLoading } = useCaregiver(id);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState("1 hr");

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

  const availableDays = caregiver.weeklyAvailability
    .filter((d) => d.available)
    .map((d) => DAY_MAP[d.short]);

  return (
    <View className="flex-1 bg-white">
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
          Select date &amp; time
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Caregiver mini card */}
        <CaregiverMiniCard
          caregiver={caregiver}
          onChangeCaregiver={() => router.back()}
        />

        {/* Calendar section */}
        <View className="px-5 mt-6">
          <Text className="text-foreground font-semibold mb-4" style={{ fontSize: 15 }}>
            Select a date
          </Text>
          <MonthCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedTime(null); // reset time when date changes
            }}
            availableDays={availableDays}
          />
        </View>

        {/* Time slots */}
        <View className="px-5 mt-6">
          <Text className="text-foreground font-semibold mb-3" style={{ fontSize: 15 }}>
            Available time slots
          </Text>
          {selectedDate === null ? (
            <Text className="text-muted" style={{ fontSize: 13 }}>
              Select a date first to see available times.
            </Text>
          ) : (
            <TimeSlotPicker
              slots={TIME_SLOTS}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
            />
          )}
        </View>

        {/* Duration */}
        <View className="px-5 mt-6">
          <Text className="text-foreground font-semibold mb-3" style={{ fontSize: 15 }}>
            Duration
          </Text>
          <DurationPicker
            durations={DURATIONS}
            selected={selectedDuration}
            onSelect={setSelectedDuration}
          />
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <BookingSummaryFooter
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedDuration={selectedDuration}
        onConfirm={() =>
          router.push({
            pathname: `/booking-summary/${caregiver.id}` as any,
            params: {
              date: selectedDate!.toISOString(),
              time: selectedTime!,
              duration: selectedDuration,
            },
          })
        }
      />
    </View>
  );
}
