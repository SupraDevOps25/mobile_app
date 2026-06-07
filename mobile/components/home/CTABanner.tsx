import { Alert, Pressable, Text, View } from "react-native";

export function CTABanner() {
  return (
    <View
      className="rounded-2xl px-5 py-5 flex-row items-center"
      style={{ backgroundColor: "#0f2460" }}
    >
      <View className="flex-1 pr-4">
        <Text
          className="text-white font-bold leading-6"
          style={{ fontSize: 15 }}
        >
          Need care today?{"\n"}We have caregivers{"\n"}available now.
        </Text>
        <Text style={{ color: "#93c5fd", fontSize: 12, marginTop: 4 }}>
          Same-day bookings available
        </Text>
      </View>
      <Pressable
        onPress={() =>
          Alert.alert("Coming soon", "Booking will be available soon.")
        }
        className="bg-white rounded-2xl px-4 py-2.5"
      >
        <Text style={{ color: "#0f2460", fontWeight: "700", fontSize: 13 }}>
          Book Now
        </Text>
      </Pressable>
    </View>
  );
}
