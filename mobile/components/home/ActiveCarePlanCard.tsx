import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SUBSCRIPTION_STATUS_LABELS, type Subscription } from "@/constants/care";
import { getPackage } from "@/constants/packages";

// Compact summary of the family's active subscription, shown on the home screen
// when they're subscribed. Taps through to the full care plan (Care tab).
export function ActiveCarePlanCard({ subscription }: { subscription: Subscription }) {
  const router = useRouter();
  const pkg = getPackage(subscription.package);
  const assigned = subscription.careTeam?.members.find(
    (m) => m.role === "assigned",
  )?.nurse;

  const pill =
    subscription.status === "matching"
      ? { bg: "rgba(251,191,36,0.2)", color: "#fbbf24" }
      : { bg: "rgba(74,222,128,0.2)", color: "#4ade80" };

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
        {pkg?.name}
      </Text>

      {assigned ? (
        <View className="flex-row items-center" style={{ marginTop: 10 }}>
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: assigned.avatarColor }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 11 }}>
              {assigned.initials}
            </Text>
          </View>
          <Text style={{ color: "#cbd5e1", fontSize: 13, marginLeft: 8 }}>
            {assigned.name} · Assigned nurse
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
