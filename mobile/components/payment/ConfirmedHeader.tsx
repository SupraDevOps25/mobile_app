import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

type Props = { bookingRef: string };

export function ConfirmedHeader({ bookingRef }: Props) {
  return (
    <View className="items-center px-6 pb-6">
      {/* Success icon — soft green ring + solid circle */}
      <View
        className="items-center justify-center mb-6"
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: "#dcfce7",
        }}
      >
        <View
          className="items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: "#22c55e",
          }}
        >
          <Ionicons name="checkmark" size={40} color="#ffffff" />
        </View>
      </View>

      {/* Title */}
      <Text
        className="font-bold text-center mb-2"
        style={{ fontSize: 24, color: "#22c55e" }}
      >
        Booking Confirmed!
      </Text>

      {/* Subtitle */}
      <Text
        className="text-muted text-center mb-5"
        style={{ fontSize: 14, lineHeight: 22 }}
      >
        Your caregiver has been notified and will arrive at your scheduled time.
      </Text>

      {/* Booking reference pill */}
      <View
        className="flex-row items-center gap-2 px-4 py-2.5 rounded-full"
        style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
      >
        <Ionicons name="ticket-outline" size={15} color="#6b7280" />
        <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
          {bookingRef}
        </Text>
      </View>
    </View>
  );
}
