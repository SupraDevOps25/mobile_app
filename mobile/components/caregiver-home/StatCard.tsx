import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

type Props = {
  value: string;
  label: string;
  trend: string;
  trendColor?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
};

export function StatCard({
  value,
  label,
  trend,
  trendColor = "#16a34a",
  icon,
  iconColor = "#16a34a",
  iconBg = "#f0fdf4",
}: Props) {
  return (
    <View
      className="flex-1 bg-card rounded-2xl p-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View
        className="rounded-full items-center justify-center mb-2"
        style={{ width: 30, height: 30, backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text className="text-foreground font-bold" style={{ fontSize: 20 }}>
        {value}
      </Text>
      <Text className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
        {label}
      </Text>
      <Text style={{ color: trendColor, fontSize: 11, fontWeight: "600", marginTop: 6 }}>
        {trend}
      </Text>
    </View>
  );
}
