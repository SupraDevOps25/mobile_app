import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { CARD_SURFACE } from "@/components/ui/AppCard";
import type { ApiFamilyStats } from "@/services/family.service";

function StatCard({
  icon,
  tint,
  bg,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  value: string;
  label: string;
}) {
  return (
    <View
      className="flex-1 items-center bg-card"
      style={{ ...CARD_SURFACE, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6 }}
    >
      <View
        className="items-center justify-center"
        style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: bg }}
      >
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text
        className="text-foreground"
        style={{ fontSize: 16, fontWeight: "800", marginTop: 7 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        className="text-muted"
        style={{ fontSize: 10, fontWeight: "700", marginTop: 2, textAlign: "center", lineHeight: 13 }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

// The family's at-a-glance stats, shown on the dashboard. Data comes from the
// cached family-stats query, so it paints instantly from cache on load and
// refreshes when that query is refetched/invalidated.
export function FamilyStatsRow({ stats }: { stats?: ApiFamilyStats }) {
  const memberSince = stats?.memberSince
    ? new Date(stats.memberSince).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <View className="flex-row" style={{ gap: 10 }}>
      <StatCard
        value={String(stats?.carePlans ?? 0)}
        label="Total bookings"
        icon="briefcase"
        tint="#1e3a8a"
        bg="#eef2ff"
      />
      <StatCard
        value={String(stats?.caregivers ?? 0)}
        label="Caregivers used"
        icon="people"
        tint="#16a34a"
        bg="#f0fdf4"
      />
      <StatCard
        value={memberSince}
        label="Member since"
        icon="ribbon"
        tint="#d97706"
        bg="#fffbeb"
      />
    </View>
  );
}
