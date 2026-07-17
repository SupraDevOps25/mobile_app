import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { CARD_SURFACE } from "@/components/ui/AppCard";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import type { ApiPastCare } from "@/services/subscription.service";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthYear(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function periodLabel(startIso: string, endIso: string): string {
  const start = monthYear(startIso);
  const end = monthYear(endIso);
  return start === end ? start : `${start} – ${end}`;
}

// A single past care engagement (an ended subscription), for the family's
// care history on the home and care screens. Taps through to full detail.
export function PastCareCard({
  item,
  onPress,
}: {
  item: ApiPastCare;
  onPress?: (item: ApiPastCare) => void;
}) {
  return (
    <Pressable
      onPress={onPress ? () => onPress(item) : undefined}
      className="bg-card rounded-2xl p-4 mb-3"
      style={CARD_SURFACE}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <Ionicons name="time-outline" size={20} color="#6b7280" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
              {item.recipientName}
            </Text>
            <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
              {PACKAGE_LABELS[item.packageType]} · {item.relationToAccount}
            </Text>
          </View>
        </View>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#f3f4f6" }}>
          <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600" }}>
            Ended
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
          <Text className="text-muted" style={{ fontSize: 12, marginLeft: 5 }}>
            {periodLabel(item.startedAt, item.endedAt)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="checkmark-done-outline" size={13} color="#9ca3af" />
          <Text className="text-muted" style={{ fontSize: 12, marginLeft: 5 }}>
            {item.completedVisits} visit{item.completedVisits === 1 ? "" : "s"} completed
          </Text>
        </View>
      </View>

      {onPress && (
        <View className="flex-row items-center mt-3">
          <Text style={{ color: "#1e3a8a", fontSize: 13, fontWeight: "600" }}>
            View details
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#1e3a8a" />
        </View>
      )}
    </Pressable>
  );
}
