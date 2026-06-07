import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedDuration: string;
  onConfirm: () => void;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatSummary(date: Date, time: string, duration: string): string {
  const day = DAY_NAMES[date.getDay()];
  const num = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return `${day} ${num} ${month} · ${time} · ${duration}`;
}

export function BookingSummaryFooter({
  selectedDate,
  selectedTime,
  selectedDuration,
  onConfirm,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const isReady = selectedDate !== null && selectedTime !== null;

  return (
    <View
      className="px-5 pt-4 bg-white"
      style={{
        paddingBottom: bottom + 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
      }}
    >
      <View className="mb-3">
        <Text className="text-muted" style={{ fontSize: 12 }}>
          Selected
        </Text>
        {isReady ? (
          <Text className="text-foreground font-semibold" style={{ fontSize: 13 }}>
            {formatSummary(selectedDate!, selectedTime!, selectedDuration)}
          </Text>
        ) : (
          <Text className="text-muted" style={{ fontSize: 13 }}>
            Choose a date and time above
          </Text>
        )}
      </View>

      <Pressable
        disabled={!isReady}
        onPress={onConfirm}
        style={{
          backgroundColor: isReady ? "#1e3a8a" : "#d1d5db",
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
          Confirm time
        </Text>
      </Pressable>
    </View>
  );
}
