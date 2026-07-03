import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@/hooks/useNotifications";
import type {
  ApiNotification,
  ApiNotificationType,
} from "@/services/notification.service";

const TYPE_STYLE: Record<
  ApiNotificationType,
  { icon: keyof typeof Ionicons.glyphMap; tint: string; bg: string }
> = {
  SUBSCRIPTION_CREATED: { icon: "sparkles-outline", tint: "#2563eb", bg: "#eff6ff" },
  TEAM_ASSIGNED: { icon: "people-outline", tint: "#2563eb", bg: "#eff6ff" },
  ASSIGNMENT_OFFER: { icon: "briefcase-outline", tint: "#4f46e5", bg: "#eef2ff" },
  ASSIGNMENT_ACCEPTED: { icon: "checkmark-circle-outline", tint: "#16a34a", bg: "#f0fdf4" },
  ASSIGNMENT_DECLINED: { icon: "close-circle-outline", tint: "#dc2626", bg: "#fef2f2" },
  CARE_ACTIVATED: { icon: "heart-outline", tint: "#16a34a", bg: "#f0fdf4" },
  VISIT_REMINDER: { icon: "calendar-outline", tint: "#2563eb", bg: "#eff6ff" },
  DAILY_LOG_SUBMITTED: { icon: "clipboard-outline", tint: "#7c3aed", bg: "#f5f3ff" },
  PAYMENT_SUCCESS: { icon: "card-outline", tint: "#16a34a", bg: "#f0fdf4" },
  PAYMENT_FAILED: { icon: "card-outline", tint: "#dc2626", bg: "#fef2f2" },
  GENERAL: { icon: "notifications-outline", tint: "#6b7280", bg: "#f3f4f6" },
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}

function NotificationRow({
  item,
  onPress,
}: {
  item: ApiNotification;
  onPress: () => void;
}) {
  const style = TYPE_STYLE[item.type] ?? TYPE_STYLE.GENERAL;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row px-5 py-4"
      style={{ backgroundColor: item.isRead ? "transparent" : "#f8fafc" }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: style.bg }}
      >
        <Ionicons name={style.icon} size={19} color={style.tint} />
      </View>
      <View className="flex-1 ml-3">
        <Text
          className="text-foreground"
          style={{ fontSize: 14.5, fontWeight: item.isRead ? "600" : "700" }}
        >
          {item.title}
        </Text>
        <Text className="text-muted" style={{ fontSize: 13, marginTop: 2, lineHeight: 18 }}>
          {item.body}
        </Text>
        <Text className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
          {relativeTime(item.sentAt)}
        </Text>
      </View>
      {!item.isRead && (
        <View
          className="rounded-full"
          style={{ width: 9, height: 9, backgroundColor: "#2563eb", marginTop: 4 }}
        />
      )}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const list = notifications ?? [];
  const hasUnread = list.some((n) => !n.isRead);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-foreground font-bold" style={{ fontSize: 18 }}>
          Notifications
        </Text>
        {hasUnread && (
          <Pressable onPress={() => markAllRead.mutate()} hitSlop={8}>
            <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "600" }}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1e3a8a" />
        </View>
      ) : list.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <Ionicons name="notifications-off-outline" size={28} color="#9ca3af" />
          </View>
          <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
            No notifications yet
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
            Updates about your care, visits and payments will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {list.map((item, i) => (
            <View key={item.id}>
              <NotificationRow
                item={item}
                onPress={() => {
                  if (!item.isRead) markRead.mutate(item.id);
                }}
              />
              {i < list.length - 1 && (
                <View style={{ height: 1, backgroundColor: "#f3f4f6", marginLeft: 68 }} />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
