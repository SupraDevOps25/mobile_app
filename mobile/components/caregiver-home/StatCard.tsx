import { Text, View } from "react-native";

type Props = {
  value: string;
  label: string;
  trend: string;
  trendColor?: string;
};

export function StatCard({ value, label, trend, trendColor = "#16a34a" }: Props) {
  return (
    <View
      className="flex-1 bg-card rounded-2xl p-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
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
