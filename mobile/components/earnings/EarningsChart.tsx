import { Text, View } from "react-native";
import type { ChartBar } from "@/constants/earnings";

const MAX_BAR_HEIGHT = 80;

type Props = {
  bars: ChartBar[];
};

export function EarningsChart({ bars }: Props) {
  const max = Math.max(...bars.map((b) => b.amountGhs), 1);

  return (
    <View className="flex-row items-end" style={{ gap: 8 }}>
      {bars.map((bar) => {
        const isTop = bar.amountGhs === max && bar.amountGhs > 0;
        // Minimum sliver so zero-earning days are still visible
        const height = Math.max((bar.amountGhs / max) * MAX_BAR_HEIGHT, 4);
        return (
          <View key={bar.label} className="flex-1 items-center">
            <View
              className="w-full rounded-t-lg"
              style={{
                height,
                backgroundColor: isTop ? "#1e3a8a" : "#bfdbfe",
              }}
            />
            <Text className="text-muted" style={{ fontSize: 10, marginTop: 6 }}>
              {bar.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
