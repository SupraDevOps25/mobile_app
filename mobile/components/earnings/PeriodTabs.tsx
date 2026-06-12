import { Pressable, Text, View } from "react-native";
import type { EarningsPeriodId } from "@/constants/earnings";

type Props = {
  periods: { id: EarningsPeriodId; label: string }[];
  selected: EarningsPeriodId;
  onSelect: (id: EarningsPeriodId) => void;
};

export function PeriodTabs({ periods, selected, onSelect }: Props) {
  return (
    <View
      className="flex-row rounded-full p-1"
      style={{ backgroundColor: "#f3f4f6" }}
    >
      {periods.map((period) => {
        const active = period.id === selected;
        return (
          <Pressable
            key={period.id}
            onPress={() => onSelect(period.id)}
            className="flex-1 items-center rounded-full py-2"
            style={{ backgroundColor: active ? "#1e3a8a" : "transparent" }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: active ? "#ffffff" : "#6b7280",
              }}
            >
              {period.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
