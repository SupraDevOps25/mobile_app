import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  title: string;
  subtitle: string;
}[] = [
  {
    icon: "eye-outline",
    tint: "#4f46e5",
    bg: "#eef2ff",
    title: "Screen reader",
    subtitle: "Works with TalkBack (Android) and VoiceOver (iOS)",
  },
  {
    icon: "text-outline",
    tint: "#16a34a",
    bg: "#f0fdf4",
    title: "Text size",
    subtitle: "Text scales with your device's font size setting",
  },
  {
    icon: "contrast-outline",
    tint: "#2563eb",
    bg: "#eff6ff",
    title: "Bold & high-contrast text",
    subtitle: "Respects your system display settings",
  },
  {
    icon: "walk-outline",
    tint: "#d97706",
    bg: "#fffbeb",
    title: "Reduce motion",
    subtitle: "Follows your device's motion preferences",
  },
];

async function openDeviceAccessibility() {
  try {
    if (Platform.OS === "android") {
      await Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS");
    } else {
      await Linking.openSettings();
    }
  } catch {
    await Linking.openSettings();
  }
}

export default function AccessibilityScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled().then((on) => {
      if (mounted) setScreenReader(on);
    });
    const sub = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (on) => setScreenReader(on),
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

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
          Accessibility
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Text className="text-muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 16, lineHeight: 20 }}>
          Supracarer works with the accessibility features built into your phone.
          Turn them on in your device settings and the app adapts automatically.
        </Text>

        {/* Live screen reader status */}
        <View
          className="flex-row items-center rounded-2xl p-4 mb-5"
          style={{ backgroundColor: screenReader ? "#f0fdf4" : "#f9fafb" }}
        >
          <Ionicons
            name={screenReader ? "checkmark-circle" : "ellipse-outline"}
            size={20}
            color={screenReader ? "#16a34a" : "#9ca3af"}
          />
          <Text
            style={{
              color: screenReader ? "#15803d" : "#6b7280",
              fontSize: 13,
              marginLeft: 8,
              flex: 1,
            }}
          >
            Screen reader is {screenReader ? "on" : "off"} on this device.
          </Text>
        </View>

        <Text className="text-muted font-semibold" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 10 }}>
          SUPPORTED
        </Text>
        <View
          className="bg-card rounded-2xl overflow-hidden"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          {FEATURES.map((f, i) => (
            <View key={f.title}>
              <View className="flex-row items-center px-4 py-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: f.bg }}
                >
                  <Ionicons name={f.icon} size={19} color={f.tint} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-foreground font-semibold" style={{ fontSize: 14.5 }}>
                    {f.title}
                  </Text>
                  <Text className="text-muted" style={{ fontSize: 12, marginTop: 1, lineHeight: 17 }}>
                    {f.subtitle}
                  </Text>
                </View>
              </View>
              {i < FEATURES.length - 1 && (
                <View style={{ height: 1, backgroundColor: "#f3f4f6", marginLeft: 64 }} />
              )}
            </View>
          ))}
        </View>

        {/* Open device settings */}
        <Pressable
          onPress={openDeviceAccessibility}
          className="flex-row items-center justify-center rounded-2xl mt-5 py-4"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          <Ionicons name="settings-outline" size={18} color="#ffffff" />
          <Text className="text-white font-bold" style={{ fontSize: 15, marginLeft: 8 }}>
            Open device accessibility settings
          </Text>
        </Pressable>

        <Text className="text-muted text-center" style={{ fontSize: 12, marginTop: 12, lineHeight: 18 }}>
          These settings live on your phone so they work across all your apps.
        </Text>
      </ScrollView>
    </View>
  );
}
