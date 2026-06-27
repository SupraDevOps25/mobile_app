import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import {
  useCancelSubscription,
  useRenewSubscription,
} from "@/hooks/useSubscription";
import type { ApiSubscription } from "@/services/subscription.service";

// Shown when a subscription is awaiting the family's renewal decision (no
// auto-renew). They explicitly renew the same package or end the service.
export function RenewalCard({
  subscription,
}: {
  subscription: ApiSubscription;
}) {
  const renew = useRenewSubscription();
  const cancel = useCancelSubscription();
  const busy = renew.isPending || cancel.isPending;

  function onRenew() {
    renew.mutate(subscription.id, {
      onError: (err: Error) => Alert.alert("Couldn't renew", err.message),
    });
  }

  function onCancel() {
    Alert.alert(
      "End care?",
      "This will end care for your loved one. You can subscribe again anytime.",
      [
        { text: "Keep care", style: "cancel" },
        {
          text: "End care",
          style: "destructive",
          onPress: () =>
            cancel.mutate(subscription.id, {
              onError: (err: Error) =>
                Alert.alert("Couldn't cancel", err.message),
            }),
        },
      ],
    );
  }

  return (
    <View
      className="rounded-2xl p-4 mt-4"
      style={{ backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" }}
    >
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Ionicons name="refresh-circle-outline" size={20} color="#b45309" />
        <Text className="font-bold" style={{ color: "#92400e", fontSize: 15 }}>
          Renew your care package
        </Text>
      </View>
      <Text style={{ color: "#92400e", fontSize: 13, marginTop: 6, lineHeight: 19 }}>
        Your {PACKAGE_LABELS[subscription.packageType]} period has ended. Renew to
        continue with the same care team, or end the service.
      </Text>

      <View className="flex-row mt-4" style={{ gap: 10 }}>
        <Pressable
          onPress={onRenew}
          disabled={busy}
          className="flex-1 rounded-xl items-center justify-center flex-row"
          style={{ backgroundColor: "#1e3a8a", paddingVertical: 13, gap: 8 }}
        >
          {renew.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white font-bold" style={{ fontSize: 14 }}>
              Renew package
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={onCancel}
          disabled={busy}
          className="rounded-xl items-center justify-center px-4"
          style={{ borderWidth: 1, borderColor: "#d1d5db", paddingVertical: 13 }}
        >
          <Text style={{ color: "#6b7280", fontWeight: "600", fontSize: 14 }}>
            End care
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
