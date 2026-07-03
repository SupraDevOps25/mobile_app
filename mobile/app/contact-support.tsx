import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SUPPORT } from "@/constants/support";

async function open(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn't open", "No app is available to handle this action.");
  }
}

function ChannelCard({
  icon,
  tint,
  bg,
  title,
  subtitle,
  actionLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
          {title}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          {subtitle}
        </Text>
      </View>
      <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: bg }}>
        <Text style={{ color: tint, fontSize: 12, fontWeight: "700" }}>
          {actionLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ContactSupportScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const emailUrl = `mailto:${SUPPORT.email}?subject=${encodeURIComponent(
    "Supracarer support request",
  )}`;
  const whatsappUrl = `https://wa.me/${SUPPORT.whatsapp}?text=${encodeURIComponent(
    "Hi Supracarer, I need help with ",
  )}`;

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
          Contact support
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
      >
        <Text className="text-muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 16, lineHeight: 20 }}>
          We&apos;re here to help with your care, billing or account. Reach us on
          whichever channel suits you.
        </Text>

        <ChannelCard
          icon="logo-whatsapp"
          tint="#16a34a"
          bg="#f0fdf4"
          title="WhatsApp"
          subtitle="Chat with us — usually the fastest reply"
          actionLabel="Chat"
          onPress={() => open(whatsappUrl)}
        />
        <ChannelCard
          icon="call-outline"
          tint="#1e3a8a"
          bg="#eff6ff"
          title="Call us"
          subtitle={SUPPORT.phone}
          actionLabel="Call"
          onPress={() => open(`tel:${SUPPORT.phone}`)}
        />
        <ChannelCard
          icon="mail-outline"
          tint="#4f46e5"
          bg="#eef2ff"
          title="Email us"
          subtitle={SUPPORT.email}
          actionLabel="Email"
          onPress={() => open(emailUrl)}
        />

        {/* Hours */}
        <View className="flex-row items-center rounded-2xl p-4 mt-2" style={{ backgroundColor: "#f9fafb" }}>
          <Ionicons name="time-outline" size={18} color="#6b7280" />
          <Text className="text-muted" style={{ fontSize: 13, marginLeft: 8, flex: 1 }}>
            Support hours: {SUPPORT.hours}
          </Text>
        </View>

        {/* Emergency note */}
        <View className="flex-row rounded-2xl p-4 mt-3" style={{ backgroundColor: "#fef2f2" }}>
          <Ionicons name="warning-outline" size={18} color="#dc2626" />
          <Text style={{ color: "#b91c1c", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
            For a medical emergency, call your local emergency number immediately —
            don&apos;t wait for a support reply.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
