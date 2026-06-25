import { Text, View } from "react-native";
import {
  SUBSCRIPTION_STATUS_LABELS,
  type Subscription,
  type SubscriptionStatus,
} from "@/constants/care";
import type { ServicePackage } from "@/constants/packages";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_PILL: Record<SubscriptionStatus, { bg: string; color: string }> = {
  matching: { bg: "rgba(251,191,36,0.2)", color: "#fbbf24" },
  "team-assigned": { bg: "rgba(96,165,250,0.2)", color: "#93c5fd" },
  active: { bg: "rgba(74,222,128,0.2)", color: "#4ade80" },
  renewing: { bg: "rgba(96,165,250,0.2)", color: "#93c5fd" },
  paused: { bg: "rgba(148,163,184,0.2)", color: "#cbd5e1" },
  cancelled: { bg: "rgba(248,113,113,0.2)", color: "#fca5a5" },
};

type Props = {
  pkg: ServicePackage;
  subscription: Subscription;
};

export function SubscriptionHeaderCard({ pkg, subscription }: Props) {
  const pill = STATUS_PILL[subscription.status];

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

      <View className="flex-row items-end justify-between mt-4">
        <View className="flex-row items-baseline">
          <Text className="text-white font-bold" style={{ fontSize: 22 }}>
            GHS {subscription.priceGhsPerMonth.toLocaleString()}
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 13, marginLeft: 4 }}>
            /month
          </Text>
        </View>
        <Text style={{ color: "#94a3b8", fontSize: 12 }}>
          Renews {formatDate(subscription.renewsOn)}
        </Text>
      </View>
    </View>
  );
}
