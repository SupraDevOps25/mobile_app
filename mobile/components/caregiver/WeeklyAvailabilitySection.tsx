import { Text, View } from "react-native";
import type { WeekDay } from "@/constants/mock-data";

type Props = { availability: WeekDay[] };

function DayColumn({ day }: { day: WeekDay }) {
  return (
    <View className="items-center" style={{ flex: 1 }}>
      <Text className="text-muted mb-2" style={{ fontSize: 12 }}>
        {day.short}
      </Text>
      <View
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: day.available ? "#22c55e" : "#d1d5db" }}
      />
    </View>
  );
}

export function WeeklyAvailabilitySection({ availability }: Props) {
  return (
    <View className="mx-5 mb-4 rounded-2xl px-5 py-4" style={{ backgroundColor: "#f9fafb" }}>
      <Text className="text-foreground font-semibold mb-4" style={{ fontSize: 13, letterSpacing: 0.5 }}>
        AVAILABILITY THIS WEEK
      </Text>
      <View className="flex-row">
        {availability.map((day) => (
          <DayColumn key={day.short} day={day} />
        ))}
      </View>
    </View>
  );
}
