import { Pressable, Text, View } from "react-native";
import type { EarningsPeriodId } from "@/constants/earnings";

type Props = {
  periods: { id: EarningsPeriodId; label: string }[];
  selected: EarningsPeriodId;
  onSelect: (id: EarningsPeriodId) => void;
  /** Active-pill colour; defaults to the family/nurse navy. */
  accent?: string;
};

export function PeriodTabs({
  periods,
  selected,
  onSelect,
  accent = "#1e3a8a",
}: Props) {
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
            style={{ backgroundColor: active ? accent : "transparent" }}
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
