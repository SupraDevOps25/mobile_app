import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { CARD_SURFACE } from "@/components/ui/AppCard";

type Props = {
  value: string;
  label: string;
  trend: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Accent colour for the icon chip and trend marker. */
  tint: string;
  /** Pastel background for the icon chip. */
  bg: string;
};

// A dashboard stat on a white card (shared border + shadow), with a small
// tinted icon chip for identity. Matches the family dashboard's stat cards.
export function StatCard({ value, label, trend, icon, tint, bg }: Props) {
  return (
    <View
      className="flex-1 bg-card"
      style={{ ...CARD_SURFACE, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 }}
    >
      <View
        className="items-center justify-center"
        style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: bg }}
      >
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text
        className="text-foreground"
        style={{ fontSize: 22, fontWeight: "800", marginTop: 8 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        className="text-muted"
        style={{ fontSize: 11, fontWeight: "700", marginTop: 1 }}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Trend sub-metric */}
      <View
        className="flex-row items-center"
        style={{ marginTop: 9, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#eef0f3" }}
      >
        <Ionicons name="trending-up" size={11} color={tint} />
        <Text
          className="text-muted"
          style={{ fontSize: 9.5, fontWeight: "700", marginLeft: 4 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {trend}
        </Text>
      </View>
    </View>
  );
}
