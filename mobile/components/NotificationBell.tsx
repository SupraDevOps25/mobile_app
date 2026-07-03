import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useUnreadCount } from "@/hooks/useNotifications";

/** Bell that opens the notifications inbox and shows an unread badge. */
export function NotificationBell({ color = "#374151" }: { color?: string }) {
  const router = useRouter();
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  return (
    <Pressable onPress={() => router.push("/notifications" as any)} hitSlop={8}>
      <Ionicons name="notifications-outline" size={24} color={color} />
      {count > 0 && (
        <View
          className="absolute items-center justify-center rounded-full"
          style={{
            top: -5,
            right: -5,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 3,
            backgroundColor: "#dc2626",
          }}
        >
          <Text className="text-white" style={{ fontSize: 9, fontWeight: "700" }}>
            {count > 9 ? "9+" : count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
