import { Text, View } from "react-native";
import type { PackageView } from "@/constants/package-presentation";
import {
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusPill,
} from "@/constants/subscription-presentation";
import type { ApiSubscription } from "@/services/subscription.service";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

type Props = {
  pkg: PackageView;
  subscription: ApiSubscription;
};

export function SubscriptionHeaderCard({ pkg, subscription }: Props) {
  const pill = subscriptionStatusPill(subscription.status);

  return (
    <View className="rounded-2xl p-5" style={{ backgroundColor: "#0f2461" }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1 }}>
            YOUR PACKAGE
          </Text>
          <Text className="text-white font-bold" style={{ fontSize: 20, marginTop: 4 }}>
            {pkg.name}
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
            {pkg.tagline}
          </Text>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: pill.bg }}>
          <Text style={{ color: pill.color, fontSize: 11, fontWeight: "600" }}>
            {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
          </Text>
        </View>
      </View>

      <View className="flex-row items-end justify-between mt-4" style={{ gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="text-white font-bold" style={{ fontSize: 22, lineHeight: 28 }}>
            GHS {subscription.priceGhs.toLocaleString()}
            <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "400" }}>
              {" "}
              /month
            </Text>
          </Text>
        </View>
        <Text style={{ color: "#94a3b8", flexShrink: 0, fontSize: 12 }}>
          Renews {formatDate(subscription.renewsAt)}
        </Text>
      </View>
    </View>
  );
}
