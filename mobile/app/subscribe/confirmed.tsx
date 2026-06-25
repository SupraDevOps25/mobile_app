import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NextStepsCard } from "@/components/packages/NextStepsCard";
import { PackageSummaryCard } from "@/components/packages/PackageSummaryCard";
import { getPackage, type PackageId } from "@/constants/packages";

export default function SubscriptionConfirmedScreen() {
  const { packageId } = useLocalSearchParams<{ packageId: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const pkg = getPackage(packageId as PackageId);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: top + 32,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      >
        {/* Success mark */}
        <View className="items-center">
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: "#dcfce7" }}
          >
            <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
          </View>
          <Text
            className="text-foreground font-bold text-center"
            style={{ fontSize: 22, marginTop: 16 }}
          >
            Subscription activated
          </Text>
          <Text
            className="text-muted text-center"
            style={{ fontSize: 14, marginTop: 6, lineHeight: 20, paddingHorizontal: 8 }}
          >
            {pkg
              ? `You're subscribed to ${pkg.name}. We're matching your care team now.`
              : "You're subscribed. We're matching your care team now."}
          </Text>
        </View>

        {pkg && (
          <View style={{ marginTop: 24 }}>
            <PackageSummaryCard pkg={pkg} />
          </View>
        )}

        <Text
          className="text-muted font-semibold"
          style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 10 }}
        >
          WHAT HAPPENS NEXT
        </Text>
        <NextStepsCard />

        <View
          className="flex-row rounded-2xl p-4 mt-5"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#2563eb" />
          <Text
            style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
          >
            Your Care Coordinator will be in touch shortly to confirm details and
            schedule the initial home visit.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        className="px-5 pt-4 bg-background"
        style={{
          paddingBottom: bottom + 12,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/(tabs)/bookings" as any)}
          style={{
            backgroundColor: "#1e3a8a",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 16 }}>
            View my care plan
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
