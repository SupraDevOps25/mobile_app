import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotifications";

function ToggleRow({
  icon,
  tint,
  bg,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <View className="flex-row items-center px-4 py-4">
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <View className="flex-1 ml-3 pr-2">
        <Text className="text-foreground font-semibold" style={{ fontSize: 14.5 }}>
          {title}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1, lineHeight: 17 }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: "#1e3a8a", false: "#e5e7eb" }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  function toggle(channel: "push" | "sms", next: boolean) {
    update.mutate(
      { [channel]: next },
      {
        onError: (err: Error) => Alert.alert("Couldn't update", err.message),
      },
    );
  }

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
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Notifications
        </Text>
      </View>

      {isLoading || !prefs ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1e3a8a" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 14, lineHeight: 19 }}>
            Choose how you&apos;d like to hear from us. In-app notifications always
            stay on — these control messages sent to your device and phone.
          </Text>

          <View
            className="bg-card rounded-2xl overflow-hidden"
            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
          >
            <ToggleRow
              icon="phone-portrait-outline"
              tint="#2563eb"
              bg="#eff6ff"
              title="Push notifications"
              subtitle="Banners on your device for care, visits and payments"
              value={prefs.push}
              disabled={update.isPending}
              onValueChange={(v) => toggle("push", v)}
            />
            <View style={{ height: 1, backgroundColor: "#f3f4f6", marginLeft: 64 }} />
            <ToggleRow
              icon="chatbubble-ellipses-outline"
              tint="#16a34a"
              bg="#f0fdf4"
              title="SMS / WhatsApp"
              subtitle="Text messages when a push can't be delivered"
              value={prefs.sms}
              disabled={update.isPending}
              onValueChange={(v) => toggle("sms", v)}
            />
          </View>

          <View className="flex-row rounded-2xl p-4 mt-4" style={{ backgroundColor: "#eff6ff" }}>
            <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
            <Text style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
              Important account and payment messages may still be sent to keep your
              care running smoothly.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
