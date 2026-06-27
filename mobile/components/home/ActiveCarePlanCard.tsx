import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import {
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusPill,
} from "@/constants/subscription-presentation";
import { avatarColor } from "@/lib/avatar";
import type { ApiSubscription } from "@/services/subscription.service";

// Compact summary of the family's active subscription, shown on the home screen
// when they're subscribed. Taps through to the full care plan (Care tab).
export function ActiveCarePlanCard({
  subscription,
}: {
  subscription: ApiSubscription;
}) {
  const router = useRouter();
  const lead =
    subscription.careTeam.nurses.find((n) => n.role === "PRIMARY") ??
    subscription.careTeam.nurses[0];
  const pill = subscriptionStatusPill(subscription.status);

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/bookings" as any)}
      className="rounded-2xl p-5"
      style={{ backgroundColor: "#0f2461" }}
    >
      <View className="flex-row items-center justify-between">
        <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1 }}>
          YOUR CARE PLAN
        </Text>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: pill.bg }}>
          <Text style={{ color: pill.color, fontSize: 11, fontWeight: "600" }}>
            {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
          </Text>
        </View>
      </View>

      <Text className="text-white font-bold" style={{ fontSize: 18, marginTop: 8 }}>
        {PACKAGE_LABELS[subscription.packageType]}
      </Text>

      {lead ? (
        <View className="flex-row items-center" style={{ marginTop: 10 }}>
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: avatarColor(lead.name) }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 11 }}>
              {lead.initials}
            </Text>
          </View>
          <Text style={{ color: "#cbd5e1", fontSize: 13, marginLeft: 8 }}>
            {lead.name} · Lead nurse
          </Text>
        </View>
      ) : (
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>
          Matching your care team…
        </Text>
      )}

      <View className="flex-row items-center" style={{ marginTop: 14 }}>
        <Text style={{ color: "#93c5fd", fontSize: 13, fontWeight: "600" }}>
          View care plan
        </Text>
        <Ionicons name="chevron-forward" size={15} color="#93c5fd" />
      </View>
    </Pressable>
  );
}
