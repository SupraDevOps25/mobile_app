import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

type Props = {
  value: string;
  label: string;
  trend: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Accent colour for the icon, value, label and trend. */
  tint: string;
  /** Pastel card background. */
  bg: string;
  /** Tinted card border. */
  border: string;
};

export function StatCard({ value, label, trend, icon, tint, bg, border }: Props) {
  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: bg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: border,
        paddingHorizontal: 12,
        paddingVertical: 12,
        shadowColor: "#0f172a",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          backgroundColor: "rgba(255,255,255,0.7)",
        }}
      >
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text
        style={{ color: tint, fontSize: 22, fontWeight: "800", marginTop: 8 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={{ color: tint, fontSize: 11, fontWeight: "700", opacity: 0.85, marginTop: 1 }}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Trend sub-metric */}
      <View
        className="flex-row items-center"
        style={{ marginTop: 9, paddingTop: 8, borderTopWidth: 1, borderTopColor: border }}
      >
        <Ionicons name="trending-up" size={11} color={tint} style={{ opacity: 0.9 }} />
        <Text
          style={{ color: tint, fontSize: 9.5, fontWeight: "700", marginLeft: 4, opacity: 0.9 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {trend}
        </Text>
      </View>
    </View>
  );
}
