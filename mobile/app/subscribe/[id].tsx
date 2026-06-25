import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NextStepsCard } from "@/components/packages/NextStepsCard";
import { PackageSummaryCard } from "@/components/packages/PackageSummaryCard";
import { getPackage, type PackageId } from "@/constants/packages";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 10 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function BillingRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View
      className="flex-row items-center justify-between py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
    >
      <Text className="text-muted" style={{ fontSize: 13 }}>
        {label}
      </Text>
      <Text
        className={bold ? "text-foreground font-bold" : "text-foreground"}
        style={{ fontSize: bold ? 15 : 13 }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function SubscribeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [processing, setProcessing] = useState(false);

  const pkg = getPackage(id as PackageId);

  if (!pkg) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Package not found.</Text>
      </View>
    );
  }

  function handleSubscribe() {
    // Phase 1 mocks activation. Real Paystack subscription billing lands in Phase 5.
    setProcessing(true);
    setTimeout(() => {
      router.replace(`/subscribe/confirmed?packageId=${pkg!.id}` as any);
    }, 1400);
  }

  const priceLabel = `GHS ${pkg.priceGhsPerMonth.toLocaleString()}`;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-3"
        style={{ paddingTop: top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          disabled={processing}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Confirm subscription
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <View style={{ marginTop: 4 }}>
          <PackageSummaryCard pkg={pkg} />
        </View>

        <SectionLabel title="Billing" />
        <View
          className="bg-card rounded-2xl px-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <BillingRow label="Monthly subscription" value={`${priceLabel}/mo`} />
          <BillingRow label="Billing cycle" value="Monthly · auto-renews" />
          <BillingRow label="Due today" value={priceLabel} bold />
        </View>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 18 }}>
          Your subscription renews automatically each month. You can cancel anytime
          before the next renewal.
        </Text>

        <SectionLabel title="What happens next" />
        <NextStepsCard />

        {/* Security note */}
        <View className="flex-row items-center justify-center mt-5" style={{ gap: 6 }}>
          <Ionicons name="lock-closed" size={13} color="#6b7280" />
          <Text className="text-muted" style={{ fontSize: 12 }}>
            Secured by Paystack · 256-bit SSL encryption
          </Text>
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
          onPress={handleSubscribe}
          disabled={processing}
          className="rounded-2xl items-center justify-center py-4 flex-row"
          style={{ backgroundColor: processing ? "#9ca3af" : "#1e3a8a", gap: 8 }}
        >
          {processing ? (
            <>
              <ActivityIndicator color="#ffffff" />
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                Activating subscription…
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color="#ffffff" />
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                Subscribe · {priceLabel}/mo
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
