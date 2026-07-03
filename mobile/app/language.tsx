import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The only supported language for the MVP.
const CURRENT = { code: "en", label: "English", note: "Default" };

// Ghanaian languages planned for a future release.
const COMING_SOON = [
  { code: "tw", label: "Twi (Akan)" },
  { code: "ee", label: "Ewe" },
  { code: "gaa", label: "Ga" },
  { code: "dag", label: "Dagbani" },
  { code: "ha", label: "Hausa" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

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
          Language
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Text className="text-muted font-semibold" style={{ fontSize: 11, letterSpacing: 1, marginTop: 6, marginBottom: 10 }}>
          APP LANGUAGE
        </Text>

        {/* Selected language */}
        <View
          className="flex-row items-center bg-card rounded-2xl px-4 py-4"
          style={{ borderWidth: 1, borderColor: "#c7d2fe" }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "#eef2ff" }}
          >
            <Ionicons name="globe-outline" size={19} color="#4f46e5" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-foreground font-semibold" style={{ fontSize: 15 }}>
              {CURRENT.label}
            </Text>
            <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
              {CURRENT.note}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#4f46e5" />
        </View>

        {/* Coming soon */}
        <Text className="text-muted font-semibold" style={{ fontSize: 11, letterSpacing: 1, marginTop: 24, marginBottom: 10 }}>
          COMING SOON
        </Text>
        <View
          className="bg-card rounded-2xl overflow-hidden"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          {COMING_SOON.map((lang, i) => (
            <View key={lang.code}>
              <View className="flex-row items-center px-4 py-4" style={{ opacity: 0.6 }}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#f3f4f6" }}
                >
                  <Ionicons name="language-outline" size={19} color="#9ca3af" />
                </View>
                <Text className="flex-1 ml-3 text-foreground font-semibold" style={{ fontSize: 15 }}>
                  {lang.label}
                </Text>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#f3f4f6" }}>
                  <Text style={{ color: "#6b7280", fontSize: 10, fontWeight: "700" }}>
                    Soon
                  </Text>
                </View>
              </View>
              {i < COMING_SOON.length - 1 && (
                <View style={{ height: 1, backgroundColor: "#f3f4f6", marginLeft: 64 }} />
              )}
            </View>
          ))}
        </View>

        <View className="flex-row rounded-2xl p-4 mt-5" style={{ backgroundColor: "#eff6ff" }}>
          <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
          <Text style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
            Supracarer is in English for now. We&apos;re working on Ghanaian
            languages so more families can use the app in their own language.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
