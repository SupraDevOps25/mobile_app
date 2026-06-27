import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { avatarColor, initialsOf } from "@/lib/avatar";
import type { ApiCoordinator } from "@/services/subscription.service";

export function CoordinatorCard({ coordinator }: { coordinator: ApiCoordinator }) {
  return (
    <View
      className="flex-row items-center bg-card rounded-2xl p-4"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{ backgroundColor: avatarColor(coordinator.name) }}
      >
        <Text className="text-white font-bold" style={{ fontSize: 14 }}>
          {initialsOf(coordinator.name)}
        </Text>
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
          {coordinator.name}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          Care Coordinator
        </Text>
      </View>

      <Pressable
        onPress={() => Linking.openURL(`tel:${coordinator.phone}`)}
        className="w-9 h-9 rounded-full items-center justify-center mr-2"
        style={{ backgroundColor: "#eff6ff" }}
        hitSlop={6}
      >
        <Ionicons name="call-outline" size={16} color="#2563eb" />
      </Pressable>
      <Pressable
        onPress={() => Alert.alert("Coming soon", "In-app chat is on the way.")}
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: "#f0fdf4" }}
        hitSlop={6}
      >
        <Ionicons name="chatbubble-outline" size={16} color="#16a34a" />
      </Pressable>
    </View>
  );
}
