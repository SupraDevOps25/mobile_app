import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaymentFailedScreen() {
  const router = useRouter();
  const { bottom, top } = useSafeAreaInsets();

  const {
    error,
    caregiverId,
    date,
    time,
    duration,
    address,
    totalAmount,
  } = useLocalSearchParams<{
    error?: string;
    caregiverId: string;
    date: string;
    time: string;
    duration: string;
    address: string;
    totalAmount: string;
  }>();

  const errorMessage =
    error ?? "We couldn't process your payment. Please check your details and try again.";

  function handleRetry() {
    router.replace({
      pathname: "/payment/process" as any,
      params: { caregiverId, date, time, duration, address, totalAmount },
    });
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top + 24, paddingBottom: 24 }}
      >
        {/* Failed icon — soft red ring + solid circle */}
        <View className="items-center px-6 pb-6">
          <View
            className="items-center justify-center mb-6"
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#fee2e2",
            }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#dc2626",
              }}
            >
              <Ionicons name="close" size={40} color="#ffffff" />
            </View>
          </View>

          {/* Title */}
          <Text
            className="font-bold text-center mb-2"
            style={{ fontSize: 24, color: "#dc2626" }}
          >
            Payment Failed
          </Text>

          {/* Error message */}
          <Text
            className="text-muted text-center"
            style={{ fontSize: 14, lineHeight: 22 }}
          >
            {errorMessage}
          </Text>
        </View>

        {/* Tips card */}
        <View
          className="mx-5 rounded-2xl px-5 py-4"
          style={{ backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" }}
        >
          <Text
            className="font-semibold mb-3"
            style={{ fontSize: 13, color: "#dc2626", letterSpacing: 0.5 }}
          >
            WHAT TO TRY
          </Text>
          {[
            "Check your card details are correct",
            "Ensure your card has sufficient funds",
            "Try a different payment card",
            "Contact your bank if the issue persists",
          ].map((tip) => (
            <View key={tip} className="flex-row items-start gap-2 mb-2">
              <Ionicons
                name="ellipse"
                size={6}
                color="#dc2626"
                style={{ marginTop: 6 }}
              />
              <Text style={{ fontSize: 13, color: "#374151", flex: 1, lineHeight: 20 }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View
        className="px-5 pt-4 gap-3 bg-white"
        style={{
          paddingBottom: bottom + 12,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={handleRetry}
          style={{
            backgroundColor: "#1e3a8a",
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            Try again
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)" as any)}
          style={{
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1.5,
            borderColor: "#e5e7eb",
          }}
        >
          <Ionicons name="home-outline" size={18} color="#374151" />
          <Text style={{ color: "#374151", fontSize: 16, fontWeight: "600" }}>
            Back to home
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
