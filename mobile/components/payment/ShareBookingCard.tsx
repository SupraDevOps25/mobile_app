import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Pressable, Text, View } from "react-native";

export function ShareBookingCard() {
  function handleShare() {
    Alert.alert("Coming soon", "Sharing booking details will be available soon.");
  }

  return (
    <View
      className="mx-5 flex-row items-center px-4 py-4 rounded-2xl"
      style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {/* Icon */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: "#e0f2fe" }}
      >
        <Ionicons name="share-social-outline" size={18} color="#0284c7" />
      </View>

      {/* Text */}
      <View className="flex-1">
        <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
          Share booking details
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          Send to a family member or caretaker
        </Text>
      </View>

      {/* Share link */}
      <Pressable onPress={handleShare} hitSlop={8}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#2563eb" }}>
          Share
        </Text>
      </Pressable>
    </View>
  );
}
