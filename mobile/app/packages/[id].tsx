import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toPackageView } from "@/constants/package-presentation";
import { usePackage } from "@/hooks/usePackages";
import type { ApiPackageType } from "@/services/package.service";

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data, isLoading, isError } = usePackage(id as ApiPackageType);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Package not found.</Text>
      </View>
    );
  }

  const pkg = toPackageView(data);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-3 bg-background"
        style={{ paddingTop: top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Package details
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >
        {/* Hero */}
        <View
          className="rounded-2xl p-5"
          style={{ backgroundColor: pkg.accentBg }}
        >
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: "#ffffff" }}
          >
            <Ionicons name={pkg.icon} size={26} color={pkg.accent} />
          </View>
          <Text className="text-foreground font-bold" style={{ fontSize: 22, marginTop: 14 }}>
            {pkg.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
            {pkg.tagline}
          </Text>
          <View className="flex-row items-baseline mt-3">
            <Text className="text-foreground font-bold" style={{ fontSize: 26 }}>
              GHS {pkg.priceGhs.toLocaleString()}
            </Text>
            <Text className="text-muted" style={{ fontSize: 14, marginLeft: 4 }}>
              /month
            </Text>
          </View>
        </View>

        {/* Ideal for */}
        <Text
          className="text-foreground"
          style={{ fontSize: 14, lineHeight: 21, marginTop: 16 }}
        >
          {pkg.idealFor}
        </Text>

        {/* Inclusions */}
        <Text
          className="text-muted font-semibold"
          style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 4 }}
        >
          WHAT&apos;S INCLUDED
        </Text>
        <View
          className="bg-card rounded-2xl px-4 py-1"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          {pkg.inclusions.map((item, index) => (
            <View
              key={item}
              className="flex-row items-center py-3"
              style={
                index === pkg.inclusions.length - 1
                  ? undefined
                  : { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }
              }
            >
              <Ionicons name="checkmark-circle" size={18} color={pkg.accent} />
              <Text
                className="text-foreground flex-1"
                style={{ fontSize: 14, marginLeft: 10 }}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        className="px-5 pt-4 bg-background"
        style={{
          paddingBottom: bottom + 12,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={() => router.push(`/subscribe/${pkg.type}` as any)}
          className="rounded-2xl items-center justify-center py-4"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 16 }}>
            Subscribe · GHS {pkg.priceGhs.toLocaleString()}/mo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
